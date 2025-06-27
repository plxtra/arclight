#Requires -PSEDition Core -Version 7
param (
    [Parameter(Mandatory=$False)]
    [System.String]
    $PackageName
)

#########################################

if (!(Test-Path "Docker-Params.ps1"))
{
	Write-Warning "Unable to find parameters. Ensure Docker-Params.ps1 exists"
	
	exit
}

# Set some defaults, which may be changed by the params file
$SolutionPath = $PWD
$SourcePath = Join-Path $SolutionPath Source
$Namespace = "motifmarkets/"
$LatestTag = "latest"
# These must be paired, to translate to/from the registry tag
$VersionRegex = "^v([\d\.]+)" # We allow extra text, so strange version formats like v1.2.3-4.5.6 match as 1.2.3 instead of being rejected
$VersionFormat = "v{0}"

# Execute the parameters script. Dot sourcing to share the execution context and inherit any variables
. ".\Docker-Params.ps1"

# ECR command line requires individual parameters
if (!($RegistryUrl -match "(?<id>\d+)\.dkr\.ecr\.(?<region>[\w-]+)\.amazonaws\.com"))
{
	Write-Warning "Invalid Amazon ECR registry URL. Must match <Registry ID>.dkr.ecr.<AWS Region>.amazonaws.com"
	
	exit
}

$AwsRegion = $Matches.region
$RegistryID = $Matches.id

#########################################

if ($PackageName -ne "")
{
	if ($Packages.ContainsKey($PackageName) -eq $false)
	{
		Write-Warning "No package exists with the name $PackageName"
		
		exit
	}
	
	$Packages = @{$PackageName = $Packages[$PackageName]}
}

Write-Host "Logging in to ${RegistryUrl}..."

# Ensure Docker is logged in to the Elastic Container Registry
$LoginOutput = aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin ${RegistryUrl}

if (!$?)
{
	Write-Warning "Failed to login to AWS container registry"
	Write-Host $LoginOutput
	exit
}

Write-Host "Examining images..."

# AWS takes a second to respond, so we run these in parallel, making the script much faster
$AllPackages = $Packages.GetEnumerator() | ForEach-Object -ThrottleLimit 4 -Parallel {
	$ProjectName = $_.Key
	$ImageName = "${using:Namespace}$($_.Value[1])"
	$ProjectPath = Join-Path $using:SourcePath $_.Value[0]
	$ProjectFileName = Join-Path $ProjectPath "package.json"

	$ProjectContent = Get-Content $ProjectFileName | ConvertFrom-Json
	
	$SourceVersionSpec = $ProjectContent.version

	$ProjectVersion = $SourceVersionSpec -as [Version]
	
	if ($ProjectVersion -eq $null)
	{
		Write-Warning "[FAULT]  ${ProjectName}: Version specifier in $ProjectFileName is invalid: $SourceVersionSpec"
		
		return # We can't deploy this, so we just abort
	}

	# Get the latest version registered in AWS. If none is found, ignore what's on stderr and just return null
	$ImageDescription = (& aws ecr describe-images --registry-id $using:RegistryID --region $using:AwsRegion --repository-name $ImageName --image-ids imageTag=$using:LatestTag 2> $null) | ConvertFrom-Json
	# Image should only have one value that matches the regex
	$ImageVersionSpec = $ImageDescription.imageDetails.imageTags | where {$_ -ne $null -and $_ -ne $using:LatestTag -and $_ -match $using:VersionRegex} | Select-Object -First 1
	
	if ($ImageVersionSpec -ne $null -and $ImageVersionSpec -match $using:VersionRegex)
	{
		$ImageVersion = $Matches[1] -as [Version]
		
		if ($ImageVersion -eq $null)
		{
			Write-Warning "[FAULT]  ${ProjectName}: Version specifier on ${ImageName}:latest is invalid: $ImageVersionSpec"
			
			return # Can't be sure of the version, so do nothing
		}
	}
	else
	{
		$ImageVersion = $null
	}
	
	return [PSCustomObject]@{ "Name" = $ProjectName; "Image" = $ImageName; "Local" = $ProjectVersion; "Published" = $ImageVersion; "Path" = $ProjectPath }
} | Sort-Object -Property "Name"

$PackagesToUpdate = $()

foreach ($Package in $AllPackages)
{
	$ProjectName = $Package.Name
	$ProjectVersion = $Package.Local
	$ImageVersion = $Package.Published
	
	if ($ProjectVersion -eq $null)
	{
		# Ignore, we printed a warning earlier
		continue
	}

	if ($ImageVersion -eq $null)
	{
		Write-Host "[NEW]    ${ProjectName}: New image at version $ProjectVersion"
	}
	else
	{
		if ($ProjectVersion -eq $ImageVersion)
		{
			# The version in the registry is the same as the version of our project
			Write-Host "[SKIP]   ${ProjectName}: Image version $ImageVersion matches Project"
			
			continue
		}
		
		if ([Version]$ProjectVersion -lt [Version]$ImageVersion)
		{
			Write-Warning "[WARN]   ${ProjectName}: Image version $ImageVersion is newer than the Project version $ProjectVersion, check you have the latest source code"
			
			continue
		}
		
		Write-Host "[UPDATE] ${ProjectName}: Update image from version $ImageVersion to $ProjectVersion"
	}
	
	# No image found, or the image version is older than the project
	$PackagesToUpdate += , $Package
}

Write-Host "Examining Git repository..."

$GitCommit = & git rev-parse --verify HEAD

#########################################

$Choices = "&Yes", "&No", "&Build Only"

if ($PackagesToUpdate.Count -gt 0)
{
	Write-Host "$($PackagesToUpdate.Count) images are out-of-date."
	
	$Choice = $Host.UI.PromptForChoice("Publish Images", "Build and Publish $($PackagesToUpdate.Count) images to ${RegistryUrl}?", $Choices, 1)
}
else
{
	Write-Host "All images are up-to-date."
	
	$Choice = $Host.UI.PromptForChoice("Republish Images", "Rebuild and republish $($AllPackages.Count) images to ${RegistryUrl}?", $Choices, 1)
	
	if ($Choice -ne 1)
	{
		$PackagesToUpdate = $AllPackages
	}
}

if ($Choice -eq 1)
{
	Write-Host "Aborted. No changes were made."
	
	exit
}

#########################################

foreach ($Package in $PackagesToUpdate)
{
	$ProjectName = $Package.Name
	$ImageName = $Package.Image
	$DockerFileName = Join-Path $Package.Path "Dockerfile"
	$ProjectVersion = $Package.Local
	$VersionTag = $VersionFormat -f $ProjectVersion
	
    Write-Host "================================================================================"
	Write-Host "===== Building $ProjectName version ${ProjectVersion} from ${SolutionPath}..."
	
    & docker build --tag "${ImageName}:latest" --tag "$RegistryUrl/${ImageName}:latest" --tag "$RegistryUrl/${ImageName}:$VersionTag" --build-arg NugetUser=$NugetUser --build-arg NugetPassword=$NugetPassword --build-arg BUILD_CONFIGURATION=$BuildConfiguration --build-arg GIT_COMMIT=$GitCommit --file $DockerFileName $SolutionPath
	
	if (!$?)
	{
		Read-Host -Prompt "Build failed. Press Enter to finish"
		exit
	}
}

Write-Host "================================================================================"

if ($Choice -eq 2)
{
	Read-Host -Prompt "Build complete. Press Enter to finish"
	
	exit
}

Write-Host "===== Pushing new images to ${RegistryUrl}..."

foreach ($Package in $PackagesToUpdate)
{
	$ProjectName = $Package.Name
	$ImageName = $Package.Image
	$ProjectVersion = $Package.Local
	$VersionTag = $VersionFormat -f $ProjectVersion
	
	Write-Host "Pushing '$RegistryUrl/${ImageName}:latest'..."
	
    & docker image push "$RegistryUrl/${ImageName}:latest"
	
	if (!$?)
	{
		Read-Host -Prompt "Pushing $ProjectName tag 'latest' failed. Press Enter to finish"
		exit
	}
	
    & docker image push "$RegistryUrl/${ImageName}:$VersionTag"
	
	if (!$?)
	{
		Read-Host -Prompt "Pushing $ProjectName tag '$VersionTag' failed. Press Enter to finish"
		exit
	}
}

Write-Host "================================================================================"

Read-Host -Prompt "Deployment complete. Press Enter to finish"
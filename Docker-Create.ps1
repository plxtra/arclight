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
$PolicyText = '{"rules":[{"rulePriority":1,"description":"Expire old Images","selection":{"tagStatus":"untagged","countType":"sinceImagePushed","countUnit":"days","countNumber":7},"action":{"type":"expire"}}]}'

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

Write-Host "Logging in to ${RegistryUrl}..."

# Ensure Docker is logged in to the Elastic Container Registry
$LoginOutput = aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin ${RegistryUrl}

if (!$?)
{
	Write-Warning "Failed to login to AWS container registry"
	Write-Host $LoginOutput
	exit
}

Write-Host "Examining repositories..."

[String[]]$ImageNames = $Packages.GetEnumerator() | foreach { "${Namespace}$($_.Value[1])" }

$RawMetadata = & aws ecr describe-repositories --registry-id $RegistryID --region $AwsRegion --repository-names @ImageNames # 2> $null
$Metadata = $RawMetadata | ConvertFrom-Json

if ($Metadata -eq $null -or $Metadata.repositories -eq $null)
{
	$Repositories = @()
}
else
{
	$Repositories = $Metadata.repositories
}

[String[]]$KnownImages = $Repositories | Select -ExpandProperty repositoryName

$RepositoriesToCreate = @()
$RepositoriesThatExist = @()

foreach ($Package in $Packages.GetEnumerator())
{
	$ProjectName = $Package.Value[0]
	$ImageName = "${Namespace}$($Package.Value[1])"
	
	if ($KnownImages -contains $ImageName)
	{
		$RepositoriesThatExist += [PSCustomObject]@{ "Name" = $ProjectName; "Image" = $ImageName }
	}
	else
	{
		Write-Host "[NEW]    ${ProjectName}: New repository to create"
		
		$RepositoriesToCreate += [PSCustomObject]@{ "Name" = $ProjectName; "Image" = $ImageName }
	}	
}

if ($RepositoriesThatExist.Count -gt 0)
{
	Write-Host "Checking lifecycle policies..."
}

# AWS takes a second to respond, so we run these in parallel, making the script much faster
$RepositoriesMissingPolicy = $RepositoriesThatExist | ForEach-Object -ThrottleLimit 4 -Parallel {
	$ProjectName = $_.Name
	$ImageName = $_.Image

	# Get the lifetime policy registered, if any. If none is found, ignore what's on stderr and just return null
	$RawMetadata = & aws ecr get-lifecycle-policy --registry-id $using:RegistryID --region $using:AwsRegion --repository-name $ImageName 2> $null
	$Metadata = $RawMetadata | ConvertFrom-Json
	
	$RepositoryArn = $Repositories | Where { $_.repositoryName -eq $ImageName } | Select -First 1 -ExpandProperty repositoryArn
	
	if ($Metadata -eq $null)
	{
		Write-Host "[UPDATE] ${ProjectName}: Repository needs lifecycle policy: $RepositoryArn"
	
		return $_
	}
	
	Write-Host "[EXISTS] ${ProjectName}: Repository already exists: $RepositoryArn"
	
	return
} | Sort-Object -Property "Name"

#########################################

$Choices = "&Yes", "&No"

if ($RepositoriesToCreate.Count -eq 0 -and $RepositoriesMissingPolicy.Count -eq 0)
{
	Write-Host "All repositories are up-to-date. No changes were made."
	
	exit
}

Write-Host "$($RepositoriesToCreate.Count) repositories missing, $($RepositoriesMissingPolicy.Count) misconfigured."

$Choice = $Host.UI.PromptForChoice("Create/Update Repositories", "Create $($RepositoriesToCreate.Count) new repositories and reconfigure $($RepositoriesMissingPolicy.Count) in ${RegistryUrl}?", $Choices, 1)

if ($Choice -eq 1)
{
	Write-Host "Aborted. No changes were made."
	
	exit
}

#########################################

foreach ($Repository in $RepositoriesToCreate)
{
	$ProjectName = $Repository.Name
	$ImageName = $Repository.Image
	
    Write-Host "================================================================================"
	
    $CreateOutput = (& aws ecr create-repository --registry-id $RegistryID --region $AwsRegion --repository-name $ImageName 2> $CreateErrors) | ConvertFrom-Json
	
	if (!$?)
	{
		Write-Host $CreateErrors
		Read-Host -Prompt "Repository creation failed. Press Enter to finish"
		exit
	}
	
	Write-Host "Created Elastic Container Repository $ImageName at $($CreateOutput.repository.repositoryArn)"
}

foreach ($Repository in $RepositoriesMissingPolicy)
{
	$ProjectName = $Repository.Name
	$ImageName = $Repository.Image
	
    Write-Host "================================================================================"
	
    $CreateOutput = (& aws ecr put-lifecycle-policy --registry-id $RegistryID --region $AwsRegion --repository-name $ImageName --lifecycle-policy-text $PolicyText 2> $CreateErrors) | ConvertFrom-Json
	
	if (!$?)
	{
		Write-Host $CreateErrors
		Read-Host -Prompt "Repository lifecycle policy configuration failed. Press Enter to finish"
		exit
	}
	
	Write-Host "Applied Lifecycle Policy to Elastic Container Repository $ImageName"
}

Write-Host "================================================================================"

Read-Host -Prompt "Deployment complete. Press Enter to finish"
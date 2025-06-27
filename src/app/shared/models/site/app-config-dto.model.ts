// No longer used

export interface IAppConfigDto {
  openId: {
    readonly authority: string;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
    readonly logoutUri: string;
    readonly silentRedirectUri: string;
    readonly scope: string;
  }
  site: {
    readonly nonProduction: boolean;
    readonly tradingEnabled: boolean;
    readonly appName: string;
    readonly brandingLogo: string;
    readonly landscape: string;
    readonly notificationServerPublicKey: string;
    readonly inactiveDistributionMethods: number[];
  }
  service: {
    readonly name: string;
    readonly description: string | undefined;
  }
  exchange: {
    readonly environment: string;
    readonly bannerOverrideEnvironment: string | undefined;
    readonly defaultDefaultExchange: string;
    readonly options: {
      readonly exchange: string;
      readonly environmentOverride: string;
    }[];
  }
  endpoints: {
    readonly motifServices: string[];
    readonly zenith: string[];
  }
  initialWatchlist: string[];
}

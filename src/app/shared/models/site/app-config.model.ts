// No longer used

import { NotificationDistributionMethodId } from "@plxtra/motif-core";

export interface IAppConfig {
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
    readonly inactiveDistributionMethods: NotificationDistributionMethodId[];
  }
  service: {
    readonly name: string;
    readonly description: string | undefined;
  }
  // exchange: {
  //   readonly environmentId: DataEnvironmentId;
  //   readonly bannerOverrideEnvironmentId: DataEnvironmentId | undefined;
  //   readonly defaultDefaultExchangeId: ExchangeId;
  //   readonly options: {
  //     readonly exchangeId: ExchangeId;
  //     readonly environmentOverrideId: DataEnvironmentId;
  //   }[];
  // }
  endpoints: {
    readonly motifServices: string[];
    readonly zenith: string[];
  }
  initialWatchlist: string[];
}

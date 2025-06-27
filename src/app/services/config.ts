import { SafeResourceUrl } from '@angular/platform-browser';
import { IndexSignatureHack } from '@pbkware/js-utils';
import { MarketIvemId, MarketsConfig, NotificationDistributionMethodId, ZenithPublisherSubscriptionManager } from '@plxtra/motif-core';

export interface Config {
  readonly service: Config.Service;
  readonly endpoints: Config.Endpoints;
  readonly openId: Config.OpenId;
  readonly initialWatchlist: Config.Watchlist;
  readonly diagnostics: Config.Diagnostics;
  readonly capabilities: Config.Capabilities;
  readonly branding: Config.Branding;
  readonly marketsConfig: MarketsConfig;
}

export namespace Config {
  export interface Service {
    readonly name: string;
    readonly description: string | undefined;
    readonly operator: string;
  }

  export interface Endpoints {
    readonly motifServices: readonly string[];
    readonly zenith: readonly string[];
    readonly notificationServerPublicKey: string | undefined;
  }

  export interface OpenId {
    readonly authority: string;
    readonly clientId: string;
    readonly redirectUri: string;
    readonly postLogoutRedirectUri: string;
    readonly silentRedirectUri: string;
    readonly scope: string;
  }

  export type Watchlist = IndexSignatureHack<MarketIvemId.Json>[];

  export interface Diagnostics {
    readonly toolsEnabled: boolean;
    readonly appNotifyErrors: boolean;
    readonly telemetry: Diagnostics.Telemetry;
    readonly zenithLogLevelId: ZenithPublisherSubscriptionManager.LogLevelId;
    readonly dataSubscriptionCachingDisabled: boolean;
    readonly fullDepthDebugLoggingEnabled: boolean;
    readonly fullDepthConsistencyCheckingEnabled: boolean;
  }

  export namespace Diagnostics {
    export const defaultToolsEnabled = false;
    export const defaultAppNotifyErrors = true;
    export const defaultDataSubscriptionCachingDisabled = false;
    export const defaultFullDepthDebugLoggingEnabled = false;
    export const defaultFullDepthConsistencyCheckingEnabled = false;

    export interface Telemetry {
      enabled: boolean;
      itemsPerMinute: number;
      maxErrorCount: number;
      itemIgnores: Telemetry.ItemIgnore[];
    }

    export namespace Telemetry {
      export const defaultEnabled = true;
      export const defaultItemsPerMinute = 3;
      export const defaultMaxErrorCount = 1;
      export const defaultItemIgnores: Telemetry.ItemIgnore[] = [];

      export interface ItemIgnore {
        typeId: ItemIgnore.TypeId;
        message?: string;
      }

      export namespace ItemIgnore {
        export const enum TypeId {
          Message = 'Message',
          Exception = 'Exception',
        }

        export namespace Type {
          export function isValidId(id: TypeId) {
            return [TypeId.Message, TypeId.Exception].includes(id);
          }
        }

        export function isMessage(itemIgnore: ItemIgnore): itemIgnore is MessageItemIgnore {
          return itemIgnore.typeId === ItemIgnore.TypeId.Message;
        }

        export function isException(itemIgnore: ItemIgnore): itemIgnore is ExceptionItemIgnore {
          return itemIgnore.typeId === ItemIgnore.TypeId.Exception;
        }
      }

      export interface MessageItemIgnore extends ItemIgnore {
        typeId: ItemIgnore.TypeId.Message;
      }

      export interface ExceptionItemIgnore extends ItemIgnore {
        typeId: ItemIgnore.TypeId.Exception;
        exceptionName?: string;
      }
    }

    export namespace ZenithLog {
      export const defaultLevelId = ZenithPublisherSubscriptionManager.LogLevelId.Off;
    }
  }

  export interface Capabilities {
    readonly tradingEnabled: boolean;
    readonly inactiveDistributionMethods: readonly NotificationDistributionMethodId[];
  }

  export namespace Capabilities {
    export const defaultTradingEnabled = false;
    export const defaultInactiveDistributionMethods: readonly NotificationDistributionMethodId[] = [];
  }

  export interface Branding {
    readonly appName: string;
    readonly logoUrl: string | undefined;
    readonly startupSplashWebPageSafeResourceUrl: SafeResourceUrl | undefined;
  }

  export namespace Branding {
    export const defaultAppName = 'Arclight';
  }
}

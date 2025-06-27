import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IndexSignatureHack, Json, createRandomUrlSearch } from '@pbkware/js-utils';
import { ConfigError, ErrorCode, ErrorCodeLogger, MarketIvemId, MarketsConfig, NotificationDistributionMethodId, ZenithPublisherSubscriptionManager } from '@plxtra/motif-core';
import { Config } from './config';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private _config: Config;

  constructor(private readonly _domSanitizer: DomSanitizer) {

  }

  public get config(): Config { return this._config; }

  async load() {
    const configFolderPath = 'config';
    const configJsonFileName = 'config.json';
    const randomUrlSearch = createRandomUrlSearch();

    const configJsonUri = `./${configFolderPath}/${configJsonFileName}${randomUrlSearch}`;
    const configResponse = await fetch(configJsonUri);

    if (configResponse.status !== 200) {
      throw new ConfigError(ErrorCode.CSL23230003998, 'ConfigHTTP',
        `${configResponse.status}: "${configResponse.statusText}" Uri: ${configJsonUri}`);
    } else {
      const configText = await configResponse.text();
      return this.loadText(configText, configFolderPath);
    }
  }

  loadText(
    jsonText: string,
    configFolderPath: string,
  ): Promise<boolean> {
    let configJson: ConfigurationService.ConfigJson;
    try {
      configJson = JSON.parse(jsonText) as ConfigurationService.ConfigJson;
    } catch (e) {
      ErrorCodeLogger.logConfigError('CSLTP988871038839', jsonText, 500);
      throw (e);
    }

    if (configJson.configFormatVersion !== ConfigurationService.acceptedConfigFormatVersion) {
      throw new ConfigError(ErrorCode.CSLTF1988871038839, '?', jsonText);
    } else {
      const service = ConfigurationService.Service.parseJson(configJson.service, jsonText);
      // const environment = ConfigurationService.Environment.parseJson(configJson.environment, service.name);
      // const exchange = ConfigurationService.Exchange.parseJson(configJson.exchange, service.name);
      const endpoints = ConfigurationService.Endpoints.parseJson(configJson.endpoints, service.name);
      const openId = ConfigurationService.OpenId.parseJson(configJson.openId, service.name);
      const initialWatchlist = ConfigurationService.InitialWatchlist.parseJson(configJson.initialWatchlist);
      const diagnostics = ConfigurationService.Diagnostics.parseJson(configJson.diagnostics, service.name);
      const capabilities = ConfigurationService.Capabilities.parseJson(configJson.capabilities);
      const branding = ConfigurationService.Branding.parseJson(this._domSanitizer, configJson.branding, service.name);
      let marketsConfig: MarketsConfig;
      const marketsConfigJson = configJson.markets;
      if (marketsConfigJson === undefined) {
        marketsConfig = MarketsConfig.createEmpty();
      } else {
        const marketsConfigResult = MarketsConfig.tryParse(marketsConfigJson);
        if (marketsConfigResult.isErr()) {
          throw new ConfigError(ErrorCode.ConfigService_MarketsConfigCouldNotBeParsed, service.name, marketsConfigResult.error);
        } else {
          marketsConfig = marketsConfigResult.value;
        }
      }
      const config: Config = {
        service,
        endpoints,
        openId,
        initialWatchlist,
        diagnostics,
        capabilities,
        branding,
        marketsConfig,
      };

      this._config = config;
      return Promise.resolve(true);
    }
  }
}

export namespace ConfigurationService {
  export function getLoadConfigFtn(configurationService: ConfigurationService) {
    return (): Promise<boolean> => loadConfig(configurationService);
  }

  function loadConfig(configurationService: ConfigurationService): Promise<boolean> {
    return configurationService.load();
  }

  export const acceptedConfigFormatVersion = '2';

  export interface ConfigJson {
    readonly configFormatVersion: string;
    readonly configComment?: string;
    readonly service: Service.ServiceJson;
    readonly endpoints: Endpoints.EndPointsJson;
    readonly openId: OpenId.OpenIdJson;
    readonly initialWatchlist?: InitialWatchlist.WatchlistJson;
    readonly diagnostics?: Diagnostics.DiagnosticsJson;
    readonly capabilities?: Capabilities.CapabilitiesJson;
    readonly branding?: Branding.BrandingJson;
    readonly markets?: Json;
  }

  export namespace Service {
    export interface ServiceJson {
      readonly name: string;
      readonly description?: string;
      readonly operator?: string;
    }

    export function parseJson(json: ServiceJson, jsonText: string) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (json === undefined) {
        throw new ConfigError(ErrorCode.Config_MissingService, '?', jsonText);
      } else {
        const name = json.name;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (name === undefined) {
          throw new ConfigError(ErrorCode.Config_ServiceMissingName, '?', jsonText);
        } else {
          const operator = json.operator;
          if (operator === undefined) {
            throw new ConfigError(ErrorCode.Config_ServiceMissingOperator, '?', jsonText);
          } else {
            const description = json.description;

            const service: Config.Service = {
              name,
              operator,
              description,
            };

            return service;
          }
        }
      }
    }
  }

  export namespace Endpoints {
    export interface EndPointsJson {
      readonly motifServices: readonly string[];
      readonly zenith: readonly string[];
      readonly notificationServerPublicKey?: string
    }

    export function parseJson(json: EndPointsJson, serviceName: string) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (json === undefined) {
        throw new ConfigError(ErrorCode.Config_MissingEndpoints, serviceName, '');
      } else {
        const motifServices = json.motifServices;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (motifServices === undefined) {
          throw new ConfigError(ErrorCode.CSEPPMSU00831852399, serviceName, '');
        } else {
          if (motifServices.length === 0) {
            throw new ConfigError(ErrorCode.CSEPPMSL00831852399, serviceName, '');
          } else {
            if (motifServices[0].length === 0) {
              throw new ConfigError(ErrorCode.CSEPPMSE00831852399, serviceName, '');
            } else {
              const zenith = json.zenith;
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (zenith === undefined) {
                throw new ConfigError(ErrorCode.CSEPPZU00831852399, serviceName, '');
              } else {
                if (zenith.length === 0) {
                  throw new ConfigError(ErrorCode.CSEPPZL00831852399, serviceName, '');
                } else {
                  if (zenith[0].length === 0) {
                    throw new ConfigError(ErrorCode.CSEPPZE00831852399, serviceName, '');
                  } else {
                    const endpoints: Config.Endpoints = {
                      motifServices,
                      zenith,
                      notificationServerPublicKey: json.notificationServerPublicKey,
                    };

                    return endpoints;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  export namespace OpenId {
    export interface OpenIdJson {
      readonly authority: string;
      readonly clientId: string;
      readonly redirectUri: string;
      readonly silentRedirectUri: string;
      readonly postLogoutRedirectUri: string;
      readonly scope: string;
    }

    export function parseJson(json: OpenIdJson, serviceName: string) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (json === undefined) {
        throw new ConfigError(ErrorCode.Config_MissingOpenId, serviceName, '');
      } else {
        const authority = json.authority;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (authority === undefined) {
          throw new ConfigError(ErrorCode.CSOIPJA0831852399, serviceName, '');
        } else {
          const clientId = json.clientId;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (clientId === undefined) {
            throw new ConfigError(ErrorCode.CSOIPJCI100194724, serviceName, '');
          } else {
            const redirectUri = json.redirectUri;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (redirectUri === undefined) {
              throw new ConfigError(ErrorCode.CSOIPJRU33448829, serviceName, '');
            } else {
              const silentRedirectUri = json.silentRedirectUri;
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (silentRedirectUri === undefined) {
                throw new ConfigError(ErrorCode.CSOIPJSR12120987, serviceName, '');
              } else {
                const postLogoutRedirectUri = json.postLogoutRedirectUri;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (postLogoutRedirectUri === undefined) {
                  throw new ConfigError(ErrorCode.CSOIPJSR12120987, serviceName, ''); // Give errorcode CSOIPJPLRU12120987 when next motif-core next published
                } else {
                  const scope = json.scope;
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  if (scope === undefined) {
                    throw new ConfigError(ErrorCode.CSOIPJSC67773223, serviceName, '');
                  } else {
                    const openId: Config.OpenId = {
                      authority,
                      clientId,
                      redirectUri,
                      postLogoutRedirectUri,
                      silentRedirectUri,
                      scope,
                    };

                    return openId;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  export namespace InitialWatchlist {
    export type WatchlistJson = IndexSignatureHack<MarketIvemId.Json>[];

    export function parseJson(json: WatchlistJson | undefined): Config.Watchlist {
        if (json === undefined) {
          return [];
        } else {
          return json;
        }
    }
  }

  export namespace Diagnostics {
    export interface DiagnosticsJson {
      readonly toolsEnabled?: boolean;
      readonly appNotifyErrors?: boolean;
      readonly telemetry?: Telemetry.TelemetryJson;
      readonly zenithLogLevel?: ZenithLog.Level;
      readonly dataSubscriptionCachingDisabled?: boolean;
      readonly fullDepthDebugLoggingEnabled?: boolean;
      readonly fullDepthConsistencyCheckingEnabled?: boolean;
    }

    export function parseJson(json: DiagnosticsJson | undefined, serviceName: string) {
      if (json === undefined) {
        const diagnostics: Config.Diagnostics = {
          toolsEnabled: Config.Diagnostics.defaultToolsEnabled,
          appNotifyErrors: Config.Diagnostics.defaultAppNotifyErrors,
          telemetry: Telemetry.parseJson(undefined, serviceName),
          zenithLogLevelId: Config.Diagnostics.ZenithLog.defaultLevelId,
          dataSubscriptionCachingDisabled: Config.Diagnostics.defaultDataSubscriptionCachingDisabled,
          fullDepthDebugLoggingEnabled: Config.Diagnostics.defaultFullDepthDebugLoggingEnabled,
          fullDepthConsistencyCheckingEnabled: Config.Diagnostics.defaultFullDepthConsistencyCheckingEnabled,
        };

        return diagnostics;
      } else {
        const diagnostics: Config.Diagnostics = {
          toolsEnabled: json.toolsEnabled ?? Config.Diagnostics.defaultToolsEnabled,
          appNotifyErrors: json.appNotifyErrors ?? Config.Diagnostics.defaultAppNotifyErrors,
          telemetry: Telemetry.parseJson(json.telemetry, serviceName),
          zenithLogLevelId: ZenithLog.parseJson(json.zenithLogLevel, serviceName),
          dataSubscriptionCachingDisabled: json.dataSubscriptionCachingDisabled ?? Config.Diagnostics.defaultDataSubscriptionCachingDisabled,
          fullDepthDebugLoggingEnabled: json.fullDepthDebugLoggingEnabled ?? Config.Diagnostics.defaultFullDepthDebugLoggingEnabled,
          fullDepthConsistencyCheckingEnabled: json.fullDepthConsistencyCheckingEnabled ?? Config.Diagnostics.defaultFullDepthConsistencyCheckingEnabled,
        };

        return diagnostics;
      }
    }

    export namespace Telemetry {
      export interface TelemetryJson {
        enabled?: boolean;
        itemsPerMinute?: number;
        maxErrorCount?: number;
        itemIgnores?: Config.Diagnostics.Telemetry.ItemIgnore[];
      }

      // eslint-disable-next-line @typescript-eslint/no-shadow
      export function parseJson(json: TelemetryJson | undefined, serviceName: string) {
        let enabled: boolean;
        let itemsPerMinute: number;
        let maxErrorCount: number;
        let itemIgnores: Config.Diagnostics.Telemetry.ItemIgnore[];

        if (json === undefined) {
          enabled = Config.Diagnostics.Telemetry.defaultEnabled;
          itemsPerMinute = Config.Diagnostics.Telemetry.defaultItemsPerMinute;
          maxErrorCount = Config.Diagnostics.Telemetry.defaultMaxErrorCount;
          itemIgnores = Config.Diagnostics.Telemetry.defaultItemIgnores;
        } else {
          enabled = json.enabled ?? Config.Diagnostics.Telemetry.defaultEnabled;
          itemsPerMinute = json.itemsPerMinute ?? Config.Diagnostics.Telemetry.defaultItemsPerMinute;
          maxErrorCount = json.maxErrorCount ?? Config.Diagnostics.Telemetry.defaultMaxErrorCount;
          itemIgnores = parseItemIgnoresJson(json.itemIgnores, serviceName);
        }
        const telemetry: Config.Diagnostics.Telemetry = {
          enabled,
          itemsPerMinute,
          maxErrorCount,
          itemIgnores,
        };

        return telemetry;
      }

      export function parseItemIgnoresJson(json: Config.Diagnostics.Telemetry.ItemIgnore[] | undefined, serviceName: string) {
        if (json !== undefined) {
          if (!Array.isArray(json)) {
            ErrorCodeLogger.logConfigError('CNSDTPIIJA13300911', serviceName);
          } else {
            let invalid = false;
            for (const itemIgnore of json) {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (typeof itemIgnore !== 'object' || itemIgnore === null) {
                ErrorCodeLogger.logConfigError('CNSDTPIIJO13300911', serviceName);
                invalid = true;
                break;
              } else {
                const typeId = itemIgnore.typeId;
                if (typeof typeId !== 'string') {
                  ErrorCodeLogger.logConfigError('CNSDTPIIJS13300911', serviceName);
                  invalid = true;
                  break;
                } else {
                  if (!Config.Diagnostics.Telemetry.ItemIgnore.Type.isValidId(typeId)) {
                    ErrorCodeLogger.logConfigError('CNSDTPIIJTU13300911', `${serviceName}: ${typeId}`);
                    invalid = true;
                    break;
                  }
                }
              }
            }

            if (!invalid) {
              return json;
            }
          }
        }
        return Config.Diagnostics.Telemetry.defaultItemIgnores;
      }
    }

    export namespace ZenithLog {
      export const enum Level {
        Off = 'off',
        Partial = 'partial',
        Full = 'full'
      }

      function tryLevelToId(value: Level): ZenithPublisherSubscriptionManager.LogLevelId | undefined {
        switch (value) {
          case Level.Off: return ZenithPublisherSubscriptionManager.LogLevelId.Off;
          case Level.Partial: return ZenithPublisherSubscriptionManager.LogLevelId.Partial;
          case Level.Full: return ZenithPublisherSubscriptionManager.LogLevelId.Full;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-shadow
      export function parseJson(level: Level | undefined, serviceName: string) {
        if (level === undefined) {
          return Config.Diagnostics.ZenithLog.defaultLevelId;
        } else {
          const levelId = tryLevelToId(level);
          if (levelId === undefined) {
            throw new ConfigError(ErrorCode.CSDZLPJ788831131, serviceName, level);
          } else {
            return levelId;
          }
        }
      }
    }
  }

  export namespace Capabilities {
    export interface CapabilitiesJson {
      readonly tradingEnabled?: boolean;
      readonly inactiveDistributionMethods?: NotificationDistributionMethodId[];
    }

    export function parseJson(json: CapabilitiesJson | undefined): Config.Capabilities {
      if (json === undefined) {
        return {
          tradingEnabled: Config.Capabilities.defaultTradingEnabled,
          inactiveDistributionMethods: Config.Capabilities.defaultInactiveDistributionMethods,
        }
      } else {
        return {
          tradingEnabled: json.tradingEnabled ?? Config.Capabilities.defaultTradingEnabled,
          inactiveDistributionMethods: json.inactiveDistributionMethods ?? Config.Capabilities.defaultInactiveDistributionMethods,
        }
      }
    }
  }

  export namespace Branding {
    export interface BrandingJson {
      readonly appName?: string;
      readonly logoUrl?: string;
      readonly startupSplashWebPageUrl?: string;
    }

    export function parseJson(sanitizer: DomSanitizer, json: BrandingJson | undefined, serviceName: string): Config.Branding {
      if (json === undefined) {
        return {
          appName: Config.Branding.defaultAppName,
          logoUrl: undefined,
          startupSplashWebPageSafeResourceUrl: undefined,
        };
      } else {
        const appName = json.appName ?? Config.Branding.defaultAppName;

        const origin = window.location.origin;
        let logoUrl = json.logoUrl;

        if (logoUrl === undefined || logoUrl.length === 0) {
          logoUrl = undefined;
        } else {
          const uRL = URL.parse(logoUrl, origin);
          if (uRL === null) {
            throw new ConfigError(ErrorCode.ConfigService_LogoUrl, serviceName, logoUrl);
          } else {
            logoUrl = uRL.href;
          }
        }

        let startupSplashWebPageSafeResourceUrl: SafeResourceUrl | undefined;
        const startupSplashWebPageUrl = json.startupSplashWebPageUrl;
        if (startupSplashWebPageUrl === undefined || startupSplashWebPageUrl.length === 0) {
          startupSplashWebPageSafeResourceUrl = undefined;
        } else {
          const uRL = URL.parse(startupSplashWebPageUrl, origin);
          if (uRL === null) {
            throw new ConfigError(ErrorCode.ConfigService_InvalidStartupSplashWebPageUrl, serviceName, startupSplashWebPageUrl);
          } else {
            startupSplashWebPageSafeResourceUrl = sanitizer.bypassSecurityTrustResourceUrl(uRL.href);
          }
        }

        return {
          appName,
          logoUrl,
          startupSplashWebPageSafeResourceUrl,
        };
      }
    }
  }

  // export const enum Environment {
  //   Production = 'production',
  //   DelayedProduction = 'delayedProduction',
  //   Demo = 'demo',
  //   Sample = 'sample'
  // }

  // export function enrich(cfg: IAppConfigDto): IAppConfig {
  //   const result = <IAppConfig>{};
  //   // copy
  //   result.openId = cfg.openId;
  //   result.site = cfg.site;
  //   result.service = cfg.service;
  //   result.endpoints = cfg.endpoints;
  //   result.initialWatchlist = cfg.initialWatchlist;

  //   // lookup
  //   if (cfg.exchange.defaultDefaultExchange === undefined)
  //     throw new ConfigurationError(ErrorIndicator.AE186345013, "No double default exchange");

  //   const defaultDefaultExchangeId = ExchangeInfo.tryJsonValueToId(cfg.exchange.defaultDefaultExchange);
  //   if (defaultDefaultExchangeId === undefined)
  //     throw new ConfigurationError(ErrorIndicator.AE213916000, `Parse exchange '${cfg.exchange.defaultDefaultExchange}'`);

  //   if (cfg.exchange.environment === undefined)
  //     throw new ConfigurationError(ErrorIndicator.AE227157476, `No exchange environment`);

  //   const environmentId = tryEnvironmentToId(<Environment>cfg.exchange.environment);
  //   if (environmentId === undefined)
  //     throw new ConfigurationError(ErrorIndicator.AE235572013, `Parse environment '${cfg.exchange.environment}'`);

  //   let bannerOverrideEnvironmentId: DataEnvironmentId | undefined;
  //   const bannerOverrideEnvironment = cfg.exchange.bannerOverrideEnvironment;
  //   if (bannerOverrideEnvironment === undefined || bannerOverrideEnvironment === '' || bannerOverrideEnvironment === null) {
  //     bannerOverrideEnvironmentId = undefined;
  //   } else {
  //     bannerOverrideEnvironmentId = tryEnvironmentToId(<Environment>cfg.exchange.bannerOverrideEnvironment);
  //     if (bannerOverrideEnvironmentId === undefined)
  //       throw new ConfigurationError(ErrorIndicator.AE253661342, `Parse banner override '${cfg.exchange.bannerOverrideEnvironment}'`);
  //   }

  //   result.exchange = {
  //     defaultDefaultExchangeId: defaultDefaultExchangeId,
  //     environmentId: environmentId,
  //     bannerOverrideEnvironmentId: bannerOverrideEnvironmentId,
  //     options: []
  //   };

  //   for (let opt of cfg.exchange.options) {
  //     let opExchangeId = ExchangeInfo.tryJsonValueToId(opt.exchange);
  //     if (opExchangeId === undefined)
  //       throw new ConfigurationError(ErrorIndicator.AE260878665);
  //     let opOverrideId = tryEnvironmentToId(<Environment>opt.environmentOverride);
  //     if (opOverrideId === undefined)
  //       throw new ConfigurationError(ErrorIndicator.AE278675780);

  //     let node = {
  //       exchangeId: opExchangeId,
  //       environmentOverrideId: opOverrideId,
  //     };
  //     result.exchange.options.push(node);
  //   }

  //   return result;
  // }
}

// Thanks: https://devblogs.microsoft.com/premier-developer/angular-how-to-editable-config-files/

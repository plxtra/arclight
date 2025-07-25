import { Injectable } from '@angular/core';
import { Logger, UnreachableCaseError } from '@pbkware/js-utils';
import { Version } from 'generated-internal-api';
import Rollbar, { LogArgument } from 'rollbar';
import { environment } from 'src/environments/environment';
import { EnvironmentSecrets } from 'src/environments/environment-secrets';
import { Config } from './config';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
    private _rollbar: Rollbar;
    private _enabled = false;
    private _enablable: boolean;
    private _configServiceName = 'Not configured yet';
    private _maxErrorCount = Config.Diagnostics.Telemetry.defaultMaxErrorCount;
    private _errorCount = 0;
    private _itemIgnores: Config.Diagnostics.Telemetry.ItemIgnore[];

    constructor() {
        const rollbarConfig = TelemetryService.rollbarConfig;
        rollbarConfig.accessToken = environment.rollbarAccessToken;
        this._enablable = rollbarConfig.accessToken !== EnvironmentSecrets.invalidRollbarAccessToken;

        this._rollbar = new Rollbar(TelemetryService.rollbarConfig);

        this._rollbar.global({
            itemsPerMinute: Config.Diagnostics.Telemetry.defaultItemsPerMinute,
            maxItems: this._maxErrorCount,
        });

        this._rollbar.configure({
            enabled: this._enabled,
            code_version: Version.commit,
            payload: {
                environment: this._configServiceName,
            },
            autoInstrument: {
                network: true,
                networkResponseHeaders: false,
                networkResponseBody: false,
                networkRequestBody: false,
                log: true,
                dom: true,
                navigation: true,
                connectivity: true,
                contentSecurityPolicy: true,
                errorOnContentSecurityPolicy: true,
            },
            checkIgnore: (isUncaught, args, item) => this.checkIgnore(isUncaught, args, item),
        });
    }

    applyConfig(config: Config) {
        this._enabled = this._enablable && config.diagnostics.telemetry.enabled;
        this._configServiceName = config.service.name;
        this._maxErrorCount = config.diagnostics.telemetry.maxErrorCount;
        this._itemIgnores = config.diagnostics.telemetry.itemIgnores;

        this._rollbar.global({
            itemsPerMinute: config.diagnostics.telemetry.itemsPerMinute,
            maxItems: this._maxErrorCount,
        });

        this._rollbar.configure({
            enabled: this._enabled,
            payload: {
                environment: this._configServiceName,
                client: {
                    javascript: {
                        code_version: Version.commit,
                        source_map_enabled: true,
                        guess_uncaught_frames: true,
                    }
                },
                server: {
                    root: 'webpack://motif/',
                    branch: 'main',
                }
            }
        });
    }

    setUser(id: string, username: string | undefined) {
        this._rollbar.configure({
            enabled: this._enabled,
            payload: {
                person: {
                    id,
                    username
                }
            }
        });
    }

    error(err: unknown) {
        if (this._enabled && this._errorCount < this._maxErrorCount) {
            this._errorCount++;
            if (typeof err === 'object' && err !== null) {
                if ('originalError' in err) {
                    const originalErr = err['originalError'];
                    err = originalErr;
                }
            }

            this._rollbar.error(err as Rollbar.LogArgument);
        }
    }

    sendLogEvent(levelId: Logger.LevelId, text: string, extraData: string | undefined) {
        switch (levelId) {
            case Logger.LevelId.Debug:
                if (extraData === undefined) {
                    this._rollbar.debug(text);
                } else {
                    this._rollbar.debug(text, extraData);
                }
                break;
            case Logger.LevelId.Info:
                if (extraData === undefined) {
                    this._rollbar.info(text);
                } else {
                    this._rollbar.info(text, extraData);
                }
                break;
            case Logger.LevelId.Warning:
                if (extraData === undefined) {
                    this._rollbar.warning(text);
                } else {
                    this._rollbar.warning(text, extraData);
                }
                break;
            case Logger.LevelId.Error:
                if (extraData === undefined) {
                    this._rollbar.error(text);
                } else {
                    this._rollbar.error(text, extraData);
                }
                break;
            case Logger.LevelId.Severe:
                if (extraData === undefined) {
                    this._rollbar.critical(text);
                } else {
                    this._rollbar.critical(text, extraData);
                }
                break;
            default:
                throw new UnreachableCaseError('THLED33938667', levelId);
        }
    }

    private checkIgnore(isUncaught: boolean, args: LogArgument[], payload: object): boolean {
        for (const arg of args) {
            if (typeof arg === 'string') {
                if (this.checkIgnoreMessage(arg)) {
                    return true;
                }
            } else {
                if (arg instanceof Error) {
                    if (this.checkIgnoreException(arg)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private checkIgnoreMessage(message: string) {
        for (const itemIgnore of this._itemIgnores) {
            if (Config.Diagnostics.Telemetry.ItemIgnore.isMessage(itemIgnore)) {
                if (itemIgnore.message !== undefined) {
                    const itemIgnoreErrorMessageRegExp = new RegExp(itemIgnore.message);
                    if (itemIgnoreErrorMessageRegExp.test(message)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private checkIgnoreException(error: Error) {
        for (const itemIgnore of this._itemIgnores) {
            if (Config.Diagnostics.Telemetry.ItemIgnore.isException(itemIgnore)) {
                let matched = false;
                if (itemIgnore.message !== undefined) {
                    const itemIgnoreErrorMessageRegExp = new RegExp(itemIgnore.message);
                    if (!itemIgnoreErrorMessageRegExp.test(error.message)) {
                        continue;
                    } else {
                        matched = true;
                    }
                }
                if (itemIgnore.exceptionName !== undefined) {
                    const itemIgnoreErrorNameRegExp = new RegExp(itemIgnore.exceptionName);
                    if (!itemIgnoreErrorNameRegExp.test(error.name)) {
                        continue;
                    } else {
                        matched = true;
                    }
                }

                if (matched) {
                    return true;
                }
            }
        }
        return false;
    }
}

export namespace TelemetryService {
    export const rollbarConfig: Rollbar.Configuration = {
        accessToken: '',
        captureUncaught: true,
        captureUnhandledRejections: true,
        stackTraceLimit: 50,
    };
}

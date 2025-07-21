import { Injectable, inject } from '@angular/core';
import { getErrorMessage, MultiEvent, SourceTzOffsetDateTime } from '@pbkware/js-utils';
import { Exchange, ZenithEnvironmentedValueParts } from '@plxtra/motif-core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ActuationService } from './actuation.service';
import { ConfigurationService } from './configuration.service';
import { LocalStorageService } from './local-storage.service';
import { OpenIdService } from './open-id-service';
import { ThemeName, ThemeService } from './theme.service';
import { UnifyService } from './unify.service';

@Injectable({
  providedIn: 'root'
})
export class PersonalisationService {
  public static readonly default_highlighTime: number = 2000;
  public static readonly default_themeName = ThemeName.defaultTheme;
  public static readonly default_displayTZ: DisplayTZ = "source";
  public static readonly default_defaultOrderGrouping: OrderGrouping = "onStatus";

  public onWriteSuccess = new MultiEvent<PersonalisationService.SuccessEventHandler>();
  public onWriteFail = new MultiEvent<PersonalisationService.FailureEventHandler>();
  public onLoadFail = new MultiEvent<PersonalisationService.FailureEventHandler>();

  private readonly _configurationService: ConfigurationService;
  private readonly _openIdService: OpenIdService;
  private readonly _themeSvc: ThemeService;
  private readonly _localStorageSvc: LocalStorageService;
  private readonly _unifySvc: UnifyService;
  private readonly _actuationSvc: ActuationService;

  private readonly _baseUrl: string;
  private _isDirty: boolean;
  private _personalisedValues: PersonalisationService.PersonalisedSettings;

  private readonly _debounceSave: Subject<void>;
  private readonly msDelaySave: number = 750;

  constructor() {
    const configSvc = inject(ConfigurationService);
    const openIdSvc = inject(OpenIdService);
    const themeSvc = inject(ThemeService);
    const localStorageSvc = inject(LocalStorageService);
    const unifySvc = inject(UnifyService);
    const actuationSvc = inject(ActuationService);

    this._configurationService = configSvc;
    this._openIdService = openIdSvc;
    this._themeSvc = themeSvc;
    this._localStorageSvc = localStorageSvc;
    this._unifySvc = unifySvc;
    this._actuationSvc = actuationSvc;

    this._isDirty = false;

    this._baseUrl = this._configurationService.config.endpoints.motifServices[0];
    this._personalisedValues = new PersonalisationService.PersonalisedSettings();
    this._debounceSave = new Subject<void>();
    this._debounceSave.pipe(debounceTime(this.msDelaySave)).subscribe({
      next: (ev) => {
        const writePromise = this.writeSettings();
        writePromise.then(
          () => {/* Do nothing on success */},
          (reason: unknown) => {
            window.arclightLogger.logError(`Failed to save personalisation settings: ${String(reason)}`); // Log the error
            this.notifyWriteFail(reason as string);
          }
        );
      }
    });
  }

  public get isDirty(): boolean {
    return this._isDirty;
  }

  public get themeName(): ThemeName | undefined {
    if (this._personalisedValues.themeName) return this._personalisedValues.themeName;
    return PersonalisationService.default_themeName;
  }
  public set themeName(v: ThemeName | undefined) {
    if (this._personalisedValues.themeName !== v) {
      this._personalisedValues.themeName = v;
      this.markDirty();
    }
  }

  public get highlightTime(): number {
    if (this._personalisedValues.highlightTime) return this._personalisedValues.highlightTime;
    return PersonalisationService.default_highlighTime;
  }
  public set highlightTime(v: number) {
    if (this._personalisedValues.highlightTime !== v) {
      this._personalisedValues.highlightTime = v;
      this.markDirty();
    }
  }

  public get displayTimeZone(): DisplayTZ {
    if (this._personalisedValues.displayTZ) return this._personalisedValues.displayTZ;
    return PersonalisationService.default_displayTZ;
  }
  public set displayTimeZone(v: DisplayTZ) {
    if (this._personalisedValues.displayTZ !== v) {
      this._personalisedValues.displayTZ = v;
      this.markDirty();
    }
  }

  public get defaultOrderGrouping(): OrderGrouping {
    if (this._personalisedValues.defaultOrderGrouping) return this._personalisedValues.defaultOrderGrouping;
    return PersonalisationService.default_defaultOrderGrouping;
  }
  public set defaultOrderGrouping(v: OrderGrouping) {
    if (this._personalisedValues.defaultOrderGrouping !== v) {
      this._personalisedValues.defaultOrderGrouping = v;
      this.markDirty();
    }
  }

  public get defaultExchange(): Exchange {
    // if (this._personalisedValues.defaultExchangeZenithCode) return this._personalisedValues.defaultExchangeZenithCode;
    return this._unifySvc.symbolsService.defaultExchange;
  }
  public set defaultExchange(v: Exchange) {
    const newZenithCode = v.zenithCode;
    if (this._personalisedValues.defaultExchangeZenithCode !== newZenithCode) {
      this._unifySvc.symbolsService.defaultExchange = v;
      this._personalisedValues.defaultExchangeZenithCode = newZenithCode;
      this.markDirty();
    }
  }

  public get inAppScanNotifications(): boolean {
    if (this._personalisedValues.enableInAppScanNotifications) return this._personalisedValues.enableInAppScanNotifications;
    return false;
  }
  public set inAppScanNotifications(v: boolean) {
    if (this._personalisedValues.enableInAppScanNotifications !== v) {
      this._personalisedValues.enableInAppScanNotifications = v;
      this._actuationSvc.activated = v;
      this.markDirty();
    }
  }

  public async loadSettings() {
    this.markClean();

    const url = new URL("/api/configuration/GetUserSetting", this._baseUrl);
    window.arclightLogger.logInfo(`Loading personalisation setitings from ${ url}`);

    const req = {} as RequestInit;
    req.credentials = "include";
    req.headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: this._openIdService.getAuthorizationHeaderValue()
    });
    req.method = "POST";

    const payload = {
      applicationFlavour: PersonalisationService.applicationFlavour,
      applicationEnvironment: PersonalisationService.applicationEnvironment,
      key: "Personalisation"
    };
    req.body = JSON.stringify(payload);

    let response: Response | undefined;
    try {
      response = await fetch(url.href, req);
    } catch (reason) {
      this._personalisedValues = this.createDefaultPersonalisedValues();
      this.notifyLoadFail(reason as string);
    }

    if (response === undefined) {
      this._personalisedValues = this.createDefaultPersonalisedValues();
      this.notifyLoadFail("Network/Server error: response is undefined");
    } else {
      switch (response.status) {
        case 200: {
          let text: string;
          try {
            text = await response.text();
          } catch(e) {
            this._personalisedValues = this.createDefaultPersonalisedValues();
            const errorText = getErrorMessage(e);
            this.notifyLoadFail(`Payload text error: ${errorText}`);
            break;
          }
          try {
            window.arclightLogger.logInfo(`Personalisation loading: ${text}`);
            this._personalisedValues = JSON.parse(text) as PersonalisationService.PersonalisedSettings;
          } catch (e) {
            this._personalisedValues = this.createDefaultPersonalisedValues();
            const errorText = getErrorMessage(e);
            this.notifyLoadFail(`Payload parse error: ${errorText}`);
          }
          break;
        }
        case 404: {
          this._personalisedValues = this.createDefaultPersonalisedValues();
          break;
        }
        default: {
          this._personalisedValues = this.createDefaultPersonalisedValues();
          this.notifyLoadFail(`Network/Server error: ${response.status}: ${response.statusText}`);
        }
      }
    }

    // apply values as required
    this._themeSvc.theme = this._personalisedValues.themeName;
    const defaultExchangeZenithCode = this._personalisedValues.defaultExchangeZenithCode;
    if (defaultExchangeZenithCode !== undefined) {
      const unenvironmentedZenithCode = ZenithEnvironmentedValueParts.getValueFromString(defaultExchangeZenithCode);
      const defaultExchange = this._unifySvc.marketsService.defaultExchangeEnvironmentExchanges.findFirstUnenvironmentedZenithCode(unenvironmentedZenithCode);
      if (defaultExchange !== undefined) {
        this._unifySvc.symbolsService.defaultExchange = defaultExchange;
      }
    }
    await this._localStorageSvc.set(LocalStorageService.LastKnownColourScheme, this._personalisedValues.themeName);
    this._actuationSvc.activated = this._personalisedValues.enableInAppScanNotifications ?? false;
  }

  public saveSettings() {
    this._debounceSave.next(undefined);
    window.arclightLogger.logInfo('Mark personalisation setting for saving')
  }

  public displayTimeZoneToModeId(): SourceTzOffsetDateTime.TimezoneModeId {
    switch (this.displayTimeZone) {
      case 'local': return SourceTzOffsetDateTime.TimezoneModeId.Local;
      case 'source': return SourceTzOffsetDateTime.TimezoneModeId.Source;
      case 'utc': return SourceTzOffsetDateTime.TimezoneModeId.Utc;
    }
  }

  private async writeSettings() {
    const url = new URL("/api/configuration/SetUserSetting", this._baseUrl);
    window.arclightLogger.logInfo(`Saving personalisation setitings to ${ this._baseUrl}`)

    await this._localStorageSvc.set(LocalStorageService.LastKnownColourScheme, this._personalisedValues.themeName);

    const req = {} as RequestInit;
    req.credentials = "include";
    req.headers = new Headers([
      ['Content-Type', 'application/json'],
      ['Authorization', this._openIdService.getAuthorizationHeaderValue()]
    ]);
    req.method = "POST";

    const payload = {
      applicationFlavour: PersonalisationService.applicationFlavour,
      applicationEnvironment: PersonalisationService.applicationEnvironment,
      key: "Personalisation",
      value: JSON.stringify(this._personalisedValues)
    };
    req.body = JSON.stringify(payload);

    try {
      const response = await fetch(url.href, req);
      if (response.status === 200 || response.status === 204) {
        window.arclightLogger.logInfo(`Personalisation saved: ${JSON.stringify(payload)}`);
        this.notifyWriteSuccess();
      } else {
        this.notifyWriteFail(`Network/Server error: ${response.status}: ${response.statusText}`);
      }
    } catch (reason) {
      this.notifyWriteFail(reason as string);
    }

    this.markClean();
  }

  private createDefaultPersonalisedValues() {
    const personalisedValues: PersonalisationService.PersonalisedSettings = {
      themeName: undefined,
      highlightTime: undefined,
      displayTZ: undefined,
      defaultOrderGrouping: undefined,
      defaultExchangeZenithCode: this._unifySvc.marketsService.defaultDefaultExchange.zenithCode,
      enableInAppScanNotifications: undefined,
    };

    return personalisedValues;
  }

  private markDirty() {
    this._isDirty = true;
  }

  private markClean() {
    this._isDirty = false;
  }

  private notifyWriteSuccess() {
    const handlers = this.onWriteSuccess.copyHandlers();
    for (let i = 0; i < handlers.length; i++) {
      handlers[i]();
    }
  }

  private notifyWriteFail(reason: string) {
    const handlers = this.onWriteFail.copyHandlers();
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](reason);
    }
  }

  private notifyLoadFail(reason: string) {
    const handlers = this.onLoadFail.copyHandlers();
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](reason);
    }
  }
}

export namespace PersonalisationService {
  export class PersonalisedSettings {
    public themeName: ThemeName | undefined;
    public highlightTime: number | undefined;
    public displayTZ: DisplayTZ | undefined;
    public defaultOrderGrouping: OrderGrouping | undefined;
    public defaultExchangeZenithCode: string | undefined;
    public enableInAppScanNotifications: boolean | undefined;
  }

  export const applicationFlavour = 'Arclight';
  export const applicationEnvironment = 'default';

  export type SuccessEventHandler = () => void;
  export type FailureEventHandler = (reason: string) => void;
}

export type DisplayTZ = "source" | "local" | "utc";
export type OrderGrouping = "onCreate" | "onUpdate" | "onAccount" | "onStatus" | "onSymbol";

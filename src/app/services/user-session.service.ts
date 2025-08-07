import { Injectable, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AssertInternalError,
  Integer,
  Logger,
  MultiEvent,
} from '@pbkware/js-utils';
import {
  MarketsService,
  PublisherSessionTerminatedReasonId,
  SessionInfoService,
  SessionState,
  SessionStateId,
  ZenithExtConnectionDataDefinition,
  ZenithExtConnectionDataItem,
  ZenithPublisherReconnectReason,
  ZenithPublisherReconnectReasonId,
  ZenithPublisherState,
  ZenithPublisherStateId
} from '@plxtra/motif-core';
import { Log, User } from 'oidc-client-ts';
import { ConfigurationService } from './configuration.service';
import { LogService } from './log-service';
import { OpenIdService } from './open-id-service';
import { PersonalisationService } from './personalisation.service';
import { ToastService } from './toast.service';
import { UnifyService } from './unify.service';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService implements OnDestroy {
  public onStateChange = new MultiEvent<UserSessionService.StateChangeEventHandler>();

  private readonly _toastService = inject(ToastService);
  private readonly _personalisationService = inject(PersonalisationService);
  private readonly _openIdService = inject(OpenIdService);

  private readonly _unifyService: UnifyService;
  private readonly _router: Router;
  private readonly _configurationService: ConfigurationService;
  private readonly _marketsService: MarketsService;
  private readonly _sessionInfoService: SessionInfoService;

  private _startPage: string | undefined;

  private _stateId: SessionStateId = SessionStateId.NotStarted;

  private _zenithExtConnectionDataItem: ZenithExtConnectionDataItem | undefined;
  private _zenithFeedOnlineChangeSubscriptionId: MultiEvent.SubscriptionId;
  private _zenithFeedStateChangeSubscriptionId: MultiEvent.SubscriptionId;
  private _zenithReconnectSubscriptionId: MultiEvent.SubscriptionId;
  private _zenithCounterSubscriptionId: MultiEvent.SubscriptionId;
  private _publisherSessionTerminatedSubscriptionId: MultiEvent.SubscriptionId;
  private _userLoadedSubscriptionId: MultiEvent.SubscriptionId;

  private _consolidatedLogMultiEvent = new MultiEvent<UserSessionService.ConsolidatedLogEventHandler>();

  constructor() {
    const router = inject(Router);
    const unifyService = inject(UnifyService);
    const logService = inject(LogService);
    const configurationService = inject(ConfigurationService);

    Log.setLevel(Log.INFO);
    Log.setLogger(logService);

    this._router = router;
    this._unifyService = unifyService;
    this._configurationService = configurationService;
    this._marketsService = unifyService.marketsService;

    this._openIdService.authenticationCompletedEventer = (user) => this.handleAuthenticationCompleted(user);
    this._openIdService.userLoadedEventer = () => this.handleUserLoaded();
    this._openIdService.accessTokenExpiredEventer = () => this.handleAccessTokenExpired();
    this._openIdService.silentRenewErrorEventer = () => this.handleSilentRenewError();
    this._userLoadedSubscriptionId = this._openIdService.subscribeUserLoadedEvent(() => this.handleUserLoaded());

    this._sessionInfoService = unifyService.sessionInfoService;
    // load up session info
    this._sessionInfoService.serviceName = this._configurationService.config.service.name;
    this._sessionInfoService.serviceDescription = this._configurationService.config.service.description;
    this._sessionInfoService.userAccessTokenExpiryTime = undefined;
    this._sessionInfoService.zenithEndpoints = this._configurationService.config.endpoints.zenith;
    this._sessionInfoService.setDiagnostics(false, false);
  }

  get sessionInfoService(): SessionInfoService { return this._sessionInfoService; }

  get running() { return this._stateId === SessionStateId.Offline || this._stateId === SessionStateId.Online; }
  get final() { return this._stateId === SessionStateId.Finalising || this._stateId === SessionStateId.Finalised; }

  public get stateId(): SessionStateId {
    return this._stateId;
  }
  public set stateId(v: SessionStateId) {
    if (v !== this._stateId) {
      this._stateId = v;
      this._sessionInfoService.stateId = this._stateId
    }
  }

  ngOnDestroy() {
    this.finalise();
  }

  finalise() {
    if (!this.final) {
      this.setStateId(SessionStateId.Finalising);
      // this._openIdService.finalise();
      this._unifyService.adi.stop();
      this._unifyService.symbolsService.finalise();
      this._unifyService.notificationChannelsService.finalise();
      this._unifyService.scansService.finalise();
      this.unsubscribeZenithExtConnection();
      this.setStateId(SessionStateId.Finalised);
      this._openIdService.unsubscribeUserLoadedEvent(this._userLoadedSubscriptionId);
      this._userLoadedSubscriptionId = undefined;
    }
  }

  async start() {
    this.setStateId(SessionStateId.Starting);
    window.arclightLogger.logInfo(`DataService: ${this._configurationService.config.service.name}`);

    window.arclightLogger.logInfo('Starting ADI');
    this._unifyService.adi.start();
    window.arclightLogger.logInfo('Connecting to Zenith');
    this._zenithExtConnectionDataItem = this.subscribeZenithExtConnection();
    window.arclightLogger.logInfo('Starting Markets service');
    await this._unifyService.marketsService.start(this._configurationService.config.marketsConfig);
    window.arclightLogger.logInfo(`Environment: ${this._marketsService.defaultExchangeEnvironment.display}`);

    this._unifyService.symbolsService.initialise();
    this._unifyService.scansService.initialise();

    await this._personalisationService.loadSettings();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this._zenithExtConnectionDataItem === undefined) {
        this.setStateId(SessionStateId.Offline);
        this._toastService.showToast('Lost connection to Zenith');
    } else {
      if (this._zenithExtConnectionDataItem.publisherOnline) {
        this.setStateId(SessionStateId.Online);
      } else {
          this.setStateId(SessionStateId.Offline);
      }
    }
  }

  subscribeConsolidatedLogEvent(handler: UserSessionService.ConsolidatedLogEventHandler) {
    return this._consolidatedLogMultiEvent.subscribe(handler);
  }

  unsubscribeConsolidatedLogEvent(subscriptionId: MultiEvent.SubscriptionId): void {
    this._consolidatedLogMultiEvent.unsubscribe(subscriptionId);
  }

  private handleAuthenticationCompleted(user: User) {
    const customState = user.state as OpenIdService.CustomState | undefined;
    this._startPage = customState?.returnUrl ?? "/stocks";
    const startPromise = this.start();
    AssertInternalError.throwErrorIfPromiseRejected(startPromise, 'USSHAC45998');
  }

  private handleUserLoaded() {
    if (this._zenithExtConnectionDataItem !== undefined) {
      this._zenithExtConnectionDataItem.updateAccessToken(this._openIdService.accessToken);
    }
  }

  private handleAccessTokenExpired() {
    if (this._zenithExtConnectionDataItem !== undefined) {
      this._zenithExtConnectionDataItem.updateAccessToken(OpenIdService.invalidAccessToken);
    }
  }

  private handleSilentRenewError() {
    const navigatePromise = this._router.navigate(['/'], { replaceUrl: true });
    AssertInternalError.throwErrorIfPromiseRejected(navigatePromise, 'USSSHSRE45999');
  }

  private handlePublisherOnlineChangeEvent(online: boolean): void {
    if (!this.final) {
      if (online) {
        if (this.running) {
          window.arclightLogger.logInfo(`Session online`);
          this.setStateId(SessionStateId.Online);
        }
      } else {
        if (this.running) {
          window.arclightLogger.logInfo(`Session offline`);
          this.setStateId(SessionStateId.Offline);
        }
      }
    }
  }

  private handleZenithStateChangeEvent(stateId: ZenithPublisherStateId, waitId: Integer): void {
    const logText = `Zenith State: ${ZenithPublisherState.idToDisplay(stateId)} (${waitId})`;
    window.arclightLogger.logInfo(logText);
  }

  private handleZenithReconnectEvent(reconnectReasonId: ZenithPublisherReconnectReasonId): void {
    const logText = `Zenith Reconnection: ${ZenithPublisherReconnectReason.idToDisplay(reconnectReasonId)}`;
    if (ZenithPublisherReconnectReason.idToNormal(reconnectReasonId)) {
      window.arclightLogger.logInfo(logText);
    } else {
      window.arclightLogger.logWarning(logText);
    }
  }

  private handleZenithCounterEvent() {
    // TBD
  }

  private handleZenithLogEvent(time: Date, logLevelId: Logger.LevelId, text: string) {
    this.notifyConsolidatedLog(time, logLevelId, text);
  }

  private async handleZenithTerminatedEvent(reasonId: PublisherSessionTerminatedReasonId, reasonCode: number, reasonText: string) {
    window.arclightLogger.logInfo(`Session terminated: ${ reasonText}`);
    await this._openIdService.clearUserState();
    await this._router.navigate(['/landing'], { state: { termination: { id: reasonId, code: reasonCode } } });
  }

  private notifyConsolidatedLog(time: Date, logLevelId: Logger.LevelId, text: string) {
    const handlers = this._consolidatedLogMultiEvent.copyHandlers();
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](time, logLevelId, text);
    }
  }

  private notifyStateChange() {
    const handlers = this.onStateChange.copyHandlers();
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](this._stateId);
    }
  }

  private setStateId(stateId: SessionStateId) {
    if (stateId !== this._stateId) {
      this._stateId = stateId;
      window.arclightLogger.logInfo(`ADI State: ${ SessionState.idToDisplay(stateId)}`);
      if (this._stateId === SessionStateId.Online && this._startPage !== undefined) {
        const navigatePromise = this._router.navigate([this._startPage], { replaceUrl: true });
        this._startPage = undefined; // prevent state change from triggering start navigate again
        AssertInternalError.throwErrorIfPromiseRejected(navigatePromise, 'USSSSSI45998');
      }
      this.notifyStateChange();
    }
  }

  private subscribeZenithExtConnection() {
    const zenithExtConnectionDataDefinition = new ZenithExtConnectionDataDefinition();
    zenithExtConnectionDataDefinition.initialAuthAccessToken = this._openIdService.accessToken;
    zenithExtConnectionDataDefinition.zenithWebsocketEndpoints = this._configurationService.config.endpoints.zenith;

    const zenithExtConnectionDataItem = this._unifyService.adi.subscribe(zenithExtConnectionDataDefinition) as ZenithExtConnectionDataItem;

    this._zenithFeedOnlineChangeSubscriptionId = zenithExtConnectionDataItem.subscribePublisherOnlineChangeEvent(
      (online) => this.handlePublisherOnlineChangeEvent(online)
    );

    this._zenithFeedStateChangeSubscriptionId = zenithExtConnectionDataItem.subscribePublisherStateChangeEvent(
      (stateId, waitId) => { this.handleZenithStateChangeEvent(stateId, waitId); }
    );

    this._zenithReconnectSubscriptionId = zenithExtConnectionDataItem.subscribeZenithReconnectEvent(
      (reconnectReasonId) => { this.handleZenithReconnectEvent(reconnectReasonId); }
    );

    this._zenithCounterSubscriptionId = zenithExtConnectionDataItem.subscribeZenithCounterEvent(
      () => { this.handleZenithCounterEvent(); }
    );

    this._publisherSessionTerminatedSubscriptionId = zenithExtConnectionDataItem.subscribeZenithSessionTerminatedEvent(
      (reasonId, reasonCode, reasonText) => {
        const handlePromise = this.handleZenithTerminatedEvent(reasonId, reasonCode, reasonText);
        AssertInternalError.throwErrorIfPromiseRejected(handlePromise, 'USSSZEC45999')
      }
    );

    return zenithExtConnectionDataItem;
  }

  private unsubscribeZenithExtConnection() {
    if (this._zenithExtConnectionDataItem !== undefined) {
      this._zenithExtConnectionDataItem.unsubscribePublisherOnlineChangeEvent(this._zenithFeedOnlineChangeSubscriptionId);
      this._zenithFeedOnlineChangeSubscriptionId = undefined;

      this._zenithExtConnectionDataItem.unsubscribePublisherStateChangeEvent(this._zenithFeedStateChangeSubscriptionId);
      this._zenithFeedStateChangeSubscriptionId = undefined;

      this._zenithExtConnectionDataItem.unsubscribeZenithReconnectEvent(this._zenithReconnectSubscriptionId);
      this._zenithReconnectSubscriptionId = undefined;

      this._zenithExtConnectionDataItem.unsubscribeZenithCounterEvent(this._zenithCounterSubscriptionId);
      this._zenithCounterSubscriptionId = undefined;

      this._zenithExtConnectionDataItem.unsubscribeZenithSessionTerminatedEvent(this._publisherSessionTerminatedSubscriptionId);
      this._publisherSessionTerminatedSubscriptionId = undefined;

      this._unifyService.adi.unsubscribe(this._zenithExtConnectionDataItem);
      this._zenithExtConnectionDataItem = undefined;
    }
  }
}

export namespace UserSessionService {
  export type StateChangeEventHandler = (stateId: SessionStateId) => void;
  export type ConsolidatedLogEventHandler = (time: Date, logLevelId: Logger.LevelId, text: string) => void;
}


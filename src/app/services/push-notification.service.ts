import { Injectable, inject } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AssertInternalError, getErrorMessage } from '@pbkware/js-utils';
import { PushStatus } from "../shared/types/push-status";
import { ConfigurationService } from "./configuration.service";

@Injectable({
  providedIn: "root"
})
export class PushNotificationService {
  private readonly _swPush: SwPush;
  private readonly _configSvc: ConfigurationService;

  private _enabled = false;
  private _permission: PermissionState;

  private _subscription: PushSubscriptionJSON | undefined = undefined;

  constructor() {
    const swPush = inject(SwPush);
    const configSvc = inject(ConfigurationService);

    this._swPush = swPush;
    this._configSvc = configSvc;

    this._enabled = this._swPush.isEnabled;
    this._permission = "denied";

    window.arclightLogger.logDebug('PUSH: Checking permissions');
    if ('permissions' in navigator) {
      const queryPromise = navigator.permissions.query({ name: 'notifications' }).then((permissionStatus: PermissionStatus) => {
        this.permission = permissionStatus.state;
        window.arclightLogger.logDebug(`PUSH: status - ${ this._permission}`);

        permissionStatus.onchange = () => {
          window.arclightLogger.logDebug(`PUSH: status changed to - ${ permissionStatus.state}`);
          this.permission = permissionStatus.state;
        };
      });
      AssertInternalError.throwErrorIfPromiseRejected(queryPromise, 'PNSC44008', 'PUSH: Error while querying notification permissions');
    }

    this._swPush.subscription.subscribe(sub => {
      this._subscription = (sub !== null) ? sub.toJSON() : undefined;

      if (sub !== null) window.arclightLogger.logInfo(`PUSH: SUB received - ${JSON.stringify(sub.toJSON())}`);
      else window.arclightLogger.logInfo(`PUSH: SUB received - NULL`);

      if (this.subscribed) {
        window.arclightLogger.logInfo(`PUSH: Subscribed with ep=${this.endPoint} p256dh=${this.p256dh} auth=${this.auth}`);
      } else {
        window.arclightLogger.logInfo(`PUSH: Undefined subscription`);
      }
    });
  }

  public get subscription(): PushSubscriptionJSON | undefined {
    return this._subscription;
  }

  public get subscribed(): boolean {
    return (this._subscription !== undefined);
  }

  public get endPoint(): string {
    return this._subscription?.endpoint ?? "";
  }

  public get p256dh(): string | undefined{
    return (this._subscription !== undefined) ? this._subscription.keys?.p256dh : undefined;
  }

  public get auth(): string | undefined {
    return (this._subscription !== undefined) ? this._subscription.keys?.auth : undefined;
  }

  public get expirationTime(): EpochTimeStamp | undefined | null {
    return (this._subscription !== undefined) ? this._subscription.expirationTime : undefined;
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public get pushStatus(): PushStatus {
    if (!this.enabled) return "Unsupported";

    switch (this.permission) {
      case "denied":
        return "Blocked";
      case "granted":
        if (this.subscribed) return "Registered";
        else return "Unregistered";
      case "prompt":
        return "Unregistered";
    }
  }

  public get permission(): PermissionState {
    return this._permission;
  }

  private set permission(v: PermissionState) {
    if (this._permission !== v) {
      this._permission = v;
      if (this._permission === "granted") {
        if (!this.subscribed)
          this.subscribe();
      }
    }
  }

  public subscribe(): void {
    // Is the ServiceWorker enabled?
    if (this.enabled) {
      // if so, then lets request to have Push established
      const serverPublicKey = this._configSvc.config.endpoints.notificationServerPublicKey;

      if (serverPublicKey === undefined || serverPublicKey === "") {
        throw new AssertInternalError('PNSS44009', 'PUSH: No server public key configured, cannot subscribe');
      } else {
        window.arclightLogger.logDebug(`PUSH: Key=${serverPublicKey}`);

        this._swPush.requestSubscription({
          serverPublicKey: serverPublicKey,
        }).catch((err: unknown) => {
          window.arclightLogger.logWarning(`PUSH: User chose to Block notifications - ${getErrorMessage(err)}`)
        });
      }
    }
  }

  public unsubscribe(): void {
    if (this.enabled && this.subscribed) {
      this._swPush.unsubscribe().then(() => {
        this._subscription = undefined;
        window.arclightLogger.logDebug('PUSH: unsubscribed');
      })
        .catch((err: unknown) => {
          window.arclightLogger.logWarning(`PUSH: error while dropping subscription ${getErrorMessage(err)}`);
        });
    }
  }
}

// Thanks: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Re-engageable_Notifications_Push
//         https://www.npmjs.com/package/simple-web-notification
//         https://blog.angular-university.io/angular-push-notifications/
//
// VAPID:  #> web-push generate-vapid-keys

import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AlertButton, AlertController } from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { Subscription, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  private readonly _swUpdate: SwUpdate;
  private readonly _alertController: AlertController;

  private readonly _updateChecker: Subscription;
  private _checkFrequencyMs: number = 30 * 60 * 1000; // 30 minutes
  private _reminder: RemindState = RemindState.None;
  private readonly _alertButtonList: AlertButton[];

  constructor() {
    const updates = inject(SwUpdate);
    const alertController = inject(AlertController);

    this._swUpdate = updates;
    this._alertController = alertController;

    // role = Cancel for default if dismissed by background press
    // Last button is default
    this._alertButtonList = [
      {
        text: 'Remind me later',
        role: 'cancel',
        cssClass: '',
        handler: () => {
          window.arclightLogger.logInfo('Service worker update: Later');
          this._reminder = RemindState.Again;
        }
      }, {
        text: "Don't remind me again",
        cssClass: '',
        handler: () => {
          window.arclightLogger.logInfo('Service worker update: Never');
          this._reminder = RemindState.Never;
        }
      }, {
        text: 'Update now',
        cssClass: 'default-option',
        handler: () => {
          window.arclightLogger.logInfo('Service worker update: Proceed');
          this._reminder = RemindState.None;
          const appUpdatePromise = this.doAppUpdate();
          AssertInternalError.throwErrorIfPromiseRejected(appUpdatePromise, 'PUSCAU39889');
        }
      }
    ];

    window.arclightLogger.logInfo(`Service worker available: ${ this._swUpdate.isEnabled}`);

    this._updateChecker = interval(this._checkFrequencyMs).subscribe({
      next: (count) => {
        if (this._swUpdate.isEnabled) {
          const checkPromise = this.checkForUpdate();
          AssertInternalError.throwErrorIfPromiseRejected(checkPromise, 'PUSCCP39887');
        }
      }
    });

    this._swUpdate.versionUpdates.pipe(
      filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      map(evt => ({
        type: 'UPDATE_AVAILABLE',
        current: evt.currentVersion,
        available: evt.latestVersion,
      }))
    ).subscribe(event => {
      const alertPromise = this.alertUpdateAvailable();
      AssertInternalError.throwErrorIfPromiseRejected(alertPromise, 'PUSCAUA39888');
    });
  }

  private async doAppUpdate() {
    await this._swUpdate.activateUpdate();
    document.location.reload();
  }

  private async checkForUpdate(): Promise<void> {
    window.arclightLogger.logInfo('Service worker: Checking for updates');
    const updateAvailable = await this._swUpdate.checkForUpdate();

    if (!updateAvailable && this._reminder === RemindState.Again) {
      this._reminder = RemindState.None;

      const alertReminder = await this._alertController.create({
        cssClass: 'ngsw-app-alert',
        header: 'Update reminder',
        message: 'Just reminding you that there is a new version of Arclight available. Update to it now?',
        buttons: this._alertButtonList
      });
      await alertReminder.present();
    }
  }

  private async alertUpdateAvailable(): Promise<void> {
    window.arclightLogger.logInfo('Service worker: Updated app event fired');

    this._reminder = RemindState.None;

    const alertUpdate = await this._alertController.create({
      cssClass: 'ngsw-app-alert',
      header: 'Update available',
      message: 'There is a new version of Arclight available. Update to it now?',
      buttons: this._alertButtonList
    });
    await alertUpdate.present();
  }
}

// Thanks: https://medium.com/innoventes/angular-pwa-and-app-update-1cfbf9c78da0

enum RemindState { None, Again, Never }

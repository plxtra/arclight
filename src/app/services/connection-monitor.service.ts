import { Injectable, OnDestroy } from "@angular/core";
import { ModalController } from '@ionic/angular/standalone';
import { MultiEvent } from '@pbkware/js-utils';
import { SessionStateId } from "@plxtra/motif-core";
import { UserSessionService } from "./user-session.service";

@Injectable({
  providedIn: 'root'
})
export class ConnectionMonitorService implements OnDestroy {
  private readonly _sessionSvc: UserSessionService;
  private readonly _modalCtl: ModalController;
  private readonly _subidStateChange: MultiEvent.SubscriptionId;

  private _modal: HTMLIonModalElement;

  constructor(
    sessionSvc: UserSessionService,
    modalCtl: ModalController
  ) {
    this._sessionSvc = sessionSvc;
    this._modalCtl = modalCtl;
    this._subidStateChange = this._sessionSvc.onStateChange.subscribe((state) => this.handleStateChange(state));
  }

  ngOnDestroy(): void {
    this._sessionSvc.onStateChange.unsubscribe(this._subidStateChange);
  }

  private handleStateChange(newState: SessionStateId) {
    window.arclightLogger.logInfo(`State change: ${ newState}`);
    return;
    // switch (newState) {
    //   case SessionStateId.Offline:
    //     if (!this._modal) {
    //       this._modal = await this._modalCtl.create({ component: ConnectionRetryModalComponent });
    //       this._modal.present();
    //     }
    //     break;
    //   default:
    //     if (this._modal) {
    //       this._modal.dismiss();
    //       this._modal = undefined;
    //     }
    //     break;
    // }
  }
}

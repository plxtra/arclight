
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonMenuButton, IonRow,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { QueryNotificationChannelsDataDefinition, QueryNotificationChannelsDataItem } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { addSharp, bugOutline, globeOutline, informationCircleOutline, logoApple, logoGoogle, mailOutline, phonePortraitOutline } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { UnifyService } from 'src/app/services/unify.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { AlterNotificationPageComponent } from 'src/app/shared/modal/alter-notification/alter-notification.page';
import { Incubator } from 'src/app/shared/models/supplementary/incubator';
import { AlterNotificationTransferModel } from 'src/app/shared/models/transfer/alter-notification.transfermodel';
import { NotificationViewModel } from 'src/app/shared/models/view/notification.viewmodel';
import { PushStatus } from 'src/app/shared/types/push-status';
import { ListDataTemplateDirective } from 'src/app/templates/list-data.template';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    OpenOrdersControlComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonContent,
    IonList,
    IonMenuButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardContent,
    IonRow,
    IonCol,
    IonBadge,
    IonLabel,
    IonItem,
    IonItemDivider,
    IonFooter,
    IonSearchbar,
    IonImg,
  ],
})
export class NotificationsPageComponent extends ListDataTemplateDirective<NotificationViewModel> implements OnInit {
  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _pushNotificationSvc: PushNotificationService;
  private readonly _alertController: AlertController;
  private readonly _configSvc: ConfigurationService;
  private readonly _sessionSvc: UserSessionService;
  private readonly _modalController: ModalController;

  private _subidNotificationsEndChanges: MultiEvent.SubscriptionId;
  private _subidCorrectnessChange: MultiEvent.SubscriptionId;

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const pushNotificationSvc = inject(PushNotificationService);
    const alertController = inject(AlertController);
    const configSvc = inject(ConfigurationService);
    const sessionSvc = inject(UserSessionService);
    const modalController = inject(ModalController);

    super();
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._pushNotificationSvc = pushNotificationSvc;
    this._alertController = alertController;
    this._configSvc = configSvc;
    this._sessionSvc = sessionSvc;
    this._modalController = modalController;

    addIcons({
      addSharp,
      informationCircleOutline,
      logoApple,
      mailOutline,
      bugOutline,
      logoGoogle,
      phonePortraitOutline,
      globeOutline,
    });
  }

  public get pushSupported(): boolean {
    return this._pushNotificationSvc.enabled;
  }

  public get pushSubscribed(): boolean {
    return this._pushNotificationSvc.subscribed;
  }

  public get pushPermission(): PermissionState {
    return this._pushNotificationSvc.permission;
  }

  public get pushStatus(): PushStatus {
    return this._pushNotificationSvc.pushStatus;
  }

  public get anyData(): boolean {
    return (this.dataAvailable && this._viewData.length > 0);
  }

  ngOnInit() {
    const queryPromise = this.queryNotifications();
    AssertInternalError.throwErrorIfPromiseRejected(queryPromise, 'NPNOI53090');
  }

  public async deviceRegistrationClick() {
    await this.presentRegisterPrompt();
  }

  public async addNewNotification() {
    const modalPrime = {
      channelId: "",
      deleting: false,
    } as AlterNotificationTransferModel;

    const modal = await this._modalController.create({
      component: AlterNotificationPageComponent,
      componentProps: { prime: modalPrime },
      cssClass: 'alter-notification-modal',
      backdropDismiss: false
    });

    const dismissPromise = modal.onDidDismiss();
    dismissPromise.then(
      (modalResult) => {
        if (modalResult.data) { // not cancelled
          // return data
          // const response = modalResult.data as NotificationUpdateResponseTransferModel;
          const queryPromise = this.queryNotifications();
          AssertInternalError.throwErrorIfPromiseRejected(queryPromise, 'NPNANNQ53090');
        }
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'NPNANND53091'); }
    );

    await modal.present();
  }

  protected resolveFilterLambda(model: NotificationViewModel): boolean {
    return (model.name.toLowerCase().includes(this._searchText.toLowerCase())
      || model.description.toLowerCase().includes(this._searchText.toLowerCase()));
  }

  private async queryNotifications() {
    const def = new QueryNotificationChannelsDataDefinition();
    const incubator = new Incubator<QueryNotificationChannelsDataItem>(this._unifySvc, def);
    try {
      const di = await incubator.incubate();
      if (di !== undefined) {
        if (di.error) {
          throw Error(di.errorText);
        } else {
          this._dataAvailable = di.usable;
          this._viewData = di.notificationChannels.map(n => NotificationViewModel.newFromDI(n, this._bundledSvc));
        }
      }
    } finally {
      incubator.finalise();
    }
  }

  private async presentRegisterPrompt() {
    const registerAlert = await this._alertController.create({
      cssClass: 'register-app-alert',
      header: 'Register device',
      message: 'Do you wish to register this device to receive alert notifications?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: '',
          handler: () => {/**/}
        }, {
          text: 'Register',
          cssClass: 'register-option',
          handler: () => {
            this._pushNotificationSvc.subscribe();
          }
        }
      ]
    });

    await registerAlert.present();
  }

  private async presentUnregisterPrompt() {
    const unregisterAlert = await this._alertController.create({
      cssClass: 'register-app-alert',
      header: 'Unregister device',
      message: 'Do you wish to unregister this device? You will no longer be able to recieve alert notifications.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: '',
          handler: () => {/**/}
        }, {
          text: 'Unegister',
          cssClass: 'unregister-option',
          handler: () => {
            this._pushNotificationSvc.unsubscribe();
          }
        }
      ]
    });

    await unregisterAlert.present();
  }
}

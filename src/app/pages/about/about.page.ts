
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { MarketsService } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { reloadCircle, returnDownBack, trash } from 'ionicons/icons';
import packageJson from 'package.json';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';
import { PersonalisationService } from '../../services/personalisation.service';
import { UnifyService } from '../../services/unify.service';
import { UserSessionService } from '../../services/user-session.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    OpenOrdersControlComponent
  ],
})
export class AboutPageComponent {
  private readonly _marketsService: MarketsService;
  private readonly _userSessionService: UserSessionService;
  private readonly _localStorage: LocalStorageService;
  private readonly _toastController: ToastController;
  private readonly _pushNotificationService: PushNotificationService;

  constructor(
    userSessionService: UserSessionService,
    localStorage: LocalStorageService,
    toastController: ToastController,
    pushNotificationService: PushNotificationService,
  ) {
    const unifyService = inject(UnifyService);
    this._marketsService = unifyService.marketsService;
    this._userSessionService = userSessionService;
    this._localStorage = localStorage;
    this._toastController = toastController;
    this._pushNotificationService = pushNotificationService;

    addIcons({
      trash,
      reloadCircle,
      returnDownBack,
    });
  }

  public get appVersion(): string {
    return packageJson.version;
  }

  public get buildEnvironment(): string {
    return this._marketsService.exchangeEnvironments.atLeastOneProduction ? "Production" : "Non-Production";
  }

  public get buildDeployment(): string {
    return PersonalisationService.applicationEnvironment; // this._configurationService.config.site.landscape;
  }

  public get pushSvc(): PushNotificationService {
    return this._pushNotificationService;
  }

  public get defaultCulture(): string {
    return window.navigator.language;
  }

  public clearStorage() {
    const promise = this.clearStorageAndToast();
    AssertInternalError.throwErrorIfPromiseRejected(promise, 'APCSTO12345');
  }

  public reloadApp() {
    window.location.href = location.origin;
  }

  // public cultureChanged(cultureTag: string) {
  //   window.motifLogger.logInfo(`CULTURE:  ${ cultureTag}`);
  // }

  private async clearStorageAndToast() {
    await this._localStorage.clear();
    const toast = await this._toastController.create({
      message: "Storage cleared",
      icon: 'information-circle',
      color: "secondary",
      duration: 1500
    });
    await toast.present();
  }
}

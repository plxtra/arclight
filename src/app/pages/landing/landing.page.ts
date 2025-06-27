
import { AfterViewInit, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonLabel,
  IonRouterLink,
  IonRow,
  IonText,
} from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { MarketsService, PublisherSessionTerminatedReasonId } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { cloudDownloadOutline } from 'ionicons/icons';
import packageJson from 'package.json';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { PwaService } from 'src/app/services/pwa.service';
import { UnifyService } from '../../services/unify.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonRouterLink,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonIcon,
    IonLabel,
    IonImg,
    IonText,
    IonButton
  ],
})
export class LandingPageComponent implements AfterViewInit {
  private readonly _router: Router;
  private readonly _alertCtl: AlertController;
  private readonly _marketsService: MarketsService;
  private readonly _pwaSvc: PwaService;
  private readonly _configurationService: ConfigurationService;

  constructor(
    router: Router,
    alertController: AlertController,
    pwaSvc: PwaService,
    configurationService: ConfigurationService,
  ) {
    this._router = router;
    this._alertCtl = alertController;
    const unifyService = inject(UnifyService);
    this._marketsService = unifyService.marketsService;
    this._pwaSvc = pwaSvc;
    this._configurationService = configurationService;

    addIcons({
      cloudDownloadOutline,
    });
  }

  public get appVersion(): string {
    return packageJson.version;
  }

  public get installAvailable(): boolean {
    return this._pwaSvc.installationAvailable;
  }

  public get nonProduction(): boolean {
    return !this._marketsService.exchangeEnvironments.atLeastOneProduction;
  }

  public get brandingImageUrl(): string {
    const logoUrl = this._configurationService.config.branding.logoUrl;
    if (logoUrl !== undefined) {
      return logoUrl;
    } else {
      return "/assets/images/logo.png";
    }
  }

  public async runInstall() {
    await this._pwaSvc.runInstallHandler();
  }

  ngAfterViewInit() {
    const extrasPromise = this.processNavigationExtras();
    AssertInternalError.throwErrorIfPromiseRejected(extrasPromise, 'LPCAVI39921');
  }

  private async processNavigationExtras() {
    const extras = this._router.getCurrentNavigation()?.extras;
    if (extras && extras.state && extras.state.termination) {
      // display info
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      switch (extras.state.termination.id) {
        case PublisherSessionTerminatedReasonId.KickedOff: {
          const alertKickOff = await this._alertCtl.create({
            header: 'Session ended',
            subHeader: 'Kicked off',
            message: "Another login session has been detected and cause this session to be terminated",
            cssClass: 'kickoff-alert',
            buttons: [{
              text: 'Ok',
              cssClass: 'default-option',
            }],
          });
          await alertKickOff.present();
          break;
        }
        default: {
          const alertTerminated = await this._alertCtl.create({
            header: 'Session ended',
            subHeader: 'Terminated',
            message: "You current session has been terminated by the server",
            cssClass: 'kickoff-alert',
            buttons: [{
              text: 'Ok',
              cssClass: 'default-option',
            }],
          });
          await alertTerminated.present();
          break;
        }
      }
    }
  }
}

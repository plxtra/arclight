
import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import {
  IonApp,
  IonAvatar,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonRow,
  IonSplitPane,
  IonText,
  Platform
} from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { SymbolsService } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { alertCircle, barChartOutline, barChartSharp, bug, cloudDownloadOutline, eyeOutline, eyeSharp, fileTrayFullOutline, fileTrayFullSharp, informationCircle, informationOutline, informationSharp, logOutOutline, logOutSharp, megaphoneOutline, megaphoneSharp, optionsOutline, optionsSharp, pricetagsOutline, pricetagsSharp, pulseOutline, pulseSharp } from 'ionicons/icons';
import packageJson from 'package.json';
import { environment } from 'src/environments/environment';
import { Md5 } from 'ts-md5';
import { ConfigurationService } from './services/configuration.service';
import { ConnectionMonitorService } from './services/connection-monitor.service';
import { LocalStorageService } from './services/local-storage.service';
import { OpenIdService } from './services/open-id-service';
import { PwaService } from './services/pwa.service';
import { ThemeName, ThemeService } from './services/theme.service';
import { UnifyService } from './services/unify.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonSplitPane,
    IonApp,
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonText,
    IonAvatar,
    IonChip,
    IonIcon,
    IonMenuToggle,
    IonRouterOutlet,
    RouterLink,
],
})
export class AppComponent implements OnInit, AfterViewInit {
  readonly version: string = packageJson.version;
  readonly beta: boolean;

  public showMenu = false;

  public appPages = [
    { title: 'Stocks', url: '/stocks', icon: 'bar-chart' },
    { title: 'Accounts', url: '/accounts', icon: 'file-tray-full' },
    { title: 'Orders', url: '/orders', icon: 'pricetags' },
    { title: 'Scans', url: '/scans', icon: 'eye' },
    { title: 'Notifications', url: '/notifications', icon: 'megaphone' },
    { title: 'Status', url: '/status', icon: 'pulse' },
    { title: 'Settings', url: '/settings', icon: 'options' },
    { title: 'About', url: '/about', icon: 'information' },
    { title: 'Logout', url: '/signout', icon: 'log-out' },
  ];

  private readonly _platform = inject(Platform);

  private readonly _router: Router;
  private readonly _activatedRoute: ActivatedRoute;
  private readonly _localStorageService: LocalStorageService;
  private readonly _pwaService: PwaService;
  private readonly _openIdService: OpenIdService;
  private readonly _themeService: ThemeService;
  private readonly _unifyService: UnifyService;
  private readonly _configurationService: ConfigurationService;
  private readonly _connectionMonitorService: ConnectionMonitorService;

  constructor() {
    const router = inject(Router);
    const activatedRoute = inject(ActivatedRoute);
    const openIdService = inject(OpenIdService);
    const themeService = inject(ThemeService);
    const pwaService = inject(PwaService);
    const localStorageService = inject(LocalStorageService);
    const unifyService = inject(UnifyService);
    const configurationService = inject(ConfigurationService);
    const connectionMonitorService = inject(ConnectionMonitorService);

    this._router = router;
    this._activatedRoute = activatedRoute;
    this._localStorageService = localStorageService;
    this._pwaService = pwaService;
    this._openIdService = openIdService;
    this._themeService = themeService;
    this._unifyService = unifyService;
    this._configurationService = configurationService;
    this._connectionMonitorService = connectionMonitorService;

    const lowerVersion = this.version.toLowerCase();
    this.beta = lowerVersion.includes('beta');

    window.arclightLogger.logInfo(`Version: ${this.version}`);
    window.arclightLogger.logInfo(`Production build: ${ environment.prodMode}`);

    addIcons({
      // required by toast controller
      bug,
      informationCircle,
      alertCircle,
      // navigation icons
      barChartOutline,
      barChartSharp,
      fileTrayFullOutline,
      fileTrayFullSharp,
      pricetagsOutline,
      pricetagsSharp,
      eyeOutline,
      eyeSharp,
      megaphoneOutline,
      megaphoneSharp,
      pulseOutline,
      pulseSharp,
      optionsOutline,
      optionsSharp,
      informationOutline,
      informationSharp,
      logOutOutline,
      logOutSharp,
      // used in AppComponent
      cloudDownloadOutline,
    });
  }

  public get installationAvailable(): boolean {
    return this._pwaService.installationAvailable;
  }

  public get username(): string {
    return this._openIdService.username;
  }

  public get fullname(): string {
    return this._openIdService.fullname;
  }

  public get hasBrandingLogo(): boolean {
    return (this._configurationService.config.branding.logoUrl !== undefined)
  }

  public get brandingLogo(): string | undefined {
    return this._configurationService.config.branding.logoUrl;
  }

  public get brandingAppName(): string {
    return this._configurationService.config.branding.appName;
  }

  public get userEmail(): string {
    return this._openIdService.userEmail;
  }

  public get userGravatarLink(): string {
    const url = `https://gravatar.com/avatar/${Md5.hashStr(this._openIdService.userEmail.trim().toLowerCase())}?d=mp`;
    return url;
  }

  public get appVersion(): string {
    return packageJson.version;
  }

  public get nonProduction(): boolean {
    return !this._unifyService.marketsService.exchangeEnvironments.atLeastOneProduction;
  }

  ngOnInit() {
    this._router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showMenu = this._activatedRoute.firstChild?.snapshot.data.showMenu !== false;
      }
    });
  }

  ngAfterViewInit() {
    this._themeService.theme = "system"; // default - load user settings after login and set theme acordingly
    // load the last used in the meantime
    const getPromise = this._localStorageService.get(LocalStorageService.LastKnownColourScheme).then((theme) => { this._themeService.theme = theme as ThemeName;});
    AssertInternalError.throwErrorIfPromiseRejected(getPromise, 'Failed to get last known color scheme');

    this._unifyService.symbolsService.pscExchangeAnnouncerChar = SymbolsService.defaultPscExchangeAnnouncerChar;
    this._unifyService.symbolsService.pscMarketAnnouncerChar = SymbolsService.defaultPscMarketAnnouncerChar;
    // this._unifyService.symbolsService.defaultExchange = this._configurationService.settings.exchange.defaultDefaultExchangeId;
    this._unifyService.symbolsService.defaultParseModeAuto = true;
  }

  public async runInstall() {
    await this._pwaService.runInstallHandler();
  }
}

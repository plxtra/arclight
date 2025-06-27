
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActionSheetOptions, PickerController } from '@ionic/angular/standalone';
import { MultiEvent } from '@pbkware/js-utils';
import { ZenithEnvironmentedValueParts } from '@plxtra/motif-core';
import { Decimal } from "decimal.js-light";
import { addIcons } from 'ionicons';
import { timerOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LocaleService } from 'src/app/services/locale.service';
import { DisplayTZ, OrderGrouping, PersonalisationService } from 'src/app/services/personalisation.service';
import { ThemeName, ThemeService } from 'src/app/services/theme.service';
import { UnifyService } from 'src/app/services/unify.service';
import { ExchangeViewModel } from 'src/app/shared/models/view/exchange.viewmodel';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    OpenOrdersControlComponent
  ],
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  public themeActionSheetOptions =
    {
      header: 'Theme',
      subHeader: 'Choose a colour theme',
      cssClass: 'standard-action-sheet'
    } as ActionSheetOptions;

  public tzActionSheetOptions =
    {
      header: 'Display timezone',
      subHeader: 'Choose a timezone',
      cssClass: 'standard-action-sheet'
    } as ActionSheetOptions;

  public exchangeActionSheetOptions =
    {
      header: 'Default exchange',
      subHeader: 'Choose an exchange',
      cssClass: 'standard-action-sheet'
    } as ActionSheetOptions;

  public groupingActionSheetOptions =
    {
      header: 'Default grouping',
      subHeader: 'Choose a default grouping when displaying orders',
      cssClass: 'standard-action-sheet'
    } as ActionSheetOptions;

  private readonly _personalisationSvc: PersonalisationService;
  private readonly _themeSvc: ThemeService;
  private readonly _toastService: ToastService;
  private readonly _unifySvc: UnifyService;
  private readonly _localeSvc: LocaleService;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  private readonly _pickerController: PickerController;

  private _subidWriteSuccess: MultiEvent.SubscriptionId;
  private _subidWriteFail: MultiEvent.SubscriptionId;

  private _debounceFlashTimer: Subject<number>;
  private readonly msDelayFlashTimerChange: number = 1250;

  private _availableExchanges: ExchangeViewModel[] = [];
  private _flashTimer: number = PersonalisationService.default_highlighTime;
  private _inAppNotifications: boolean;

  constructor(
    personalisationSvc: PersonalisationService,
    themeSvc: ThemeService,
    toastService: ToastService,
    unifySvc: UnifyService,
    localeSvc: LocaleService,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    pickerController: PickerController
  ) {
    this._personalisationSvc = personalisationSvc;
    this._themeSvc = themeSvc;
    this._toastService = toastService;
    this._unifySvc = unifySvc;
    this._localeSvc = localeSvc;
    this._pickerController = pickerController;

    this._debounceFlashTimer = new Subject<number>();
    this._debounceFlashTimer.pipe(debounceTime(this.msDelayFlashTimerChange)).subscribe({
      next: (ev) => {
        this._personalisationSvc.highlightTime = ev;
        this._personalisationSvc.saveSettings();
      }
    });

    addIcons({
      timerOutline,
    });
  }

  public get availableExchanges(): ExchangeViewModel[] {
    return this._availableExchanges;
  }

  // Theme
  public get theme(): ThemeName | undefined {
    return this._themeSvc.theme;
  }
  public set theme(v: ThemeName | undefined) {
    if (this._themeSvc.theme !== v) {
      this._themeSvc.theme = v;
      this._personalisationSvc.themeName = v;
      this._personalisationSvc.saveSettings();
    }
  }

  // DisplayTZ
  public get displayTZ(): DisplayTZ {
    return this._personalisationSvc.displayTimeZone;
  }
  public set displayTZ(v: DisplayTZ) {
    if (this._personalisationSvc.displayTimeZone !== v) {
      this._personalisationSvc.displayTimeZone = v;
      this._personalisationSvc.saveSettings();
    }
  }

  // FlashTimer
  public get flashTimer(): number {
    return this._flashTimer;
  }
  public set flashTimer(v: number) {
    if (this._flashTimer !== v) {
      this._flashTimer = v;
      this._debounceFlashTimer.next(v);
    }
  }

  public get flashTimerDisplay(): string {
    const d = new Decimal(this._flashTimer / 1000);
    return `${d.toFixed(2)}sec`
  }

  // Default Exchange (Name)
  public get defaultExchange(): string {
    return this._personalisationSvc.defaultExchange.zenithCode;
  }
  public set defaultExchange(v: string) {
    const unenvironmentedZenithCode = ZenithEnvironmentedValueParts.getValueFromString(v);
    const exchange = this._unifySvc.marketsService.defaultExchangeEnvironmentExchanges.findFirstUnenvironmentedZenithCode(unenvironmentedZenithCode);
    if (exchange === undefined)
      return;
    if (this._personalisationSvc.defaultExchange !== exchange) {
      this._personalisationSvc.defaultExchange = exchange;
      this._personalisationSvc.saveSettings();
    }
  }

  // Default order grouping
  public get defaultOrderGrouping(): OrderGrouping {
    return this._personalisationSvc.defaultOrderGrouping;
  }
  public set defaultOrderGrouping(v: OrderGrouping) {
    if (this._personalisationSvc.defaultOrderGrouping !== v) {
      this._personalisationSvc.defaultOrderGrouping = v;
      this._personalisationSvc.saveSettings();
    }
  }

  // In-app scan notifications

  public get inAppNotifications(): boolean {
    return this._personalisationSvc.inAppScanNotifications;
  }
  public set inAppNotifications(v: boolean) {
    if (this._inAppNotifications !== v) {
      this._personalisationSvc.inAppScanNotifications = v;
      this._personalisationSvc.saveSettings();
    }
  }

  ngOnInit() {

    this._flashTimer = this._personalisationSvc.highlightTime;
    this.theme = this._personalisationSvc.themeName;

    this._availableExchanges = this._unifySvc.marketsService.defaultExchangeEnvironmentExchanges.toArray().map(exchange => ExchangeViewModel.newFromExchange(exchange));

    this._subidWriteSuccess = this._personalisationSvc.onWriteSuccess.subscribe(() => {
      this._toastService.showToast('Settings saved', 1500, 'information-circle', 'secondary');
    });

    this._subidWriteFail = this._personalisationSvc.onWriteFail.subscribe((reason) => {
      this._toastService.showToast('Settings failed' + reason, 1500, 'alert-circle', 'danger');
    });
  }

  ngOnDestroy(): void {
    this._personalisationSvc.onWriteSuccess.unsubscribe(this._subidWriteSuccess);
    this._personalisationSvc.onWriteFail.unsubscribe(this._subidWriteFail);
  }
}

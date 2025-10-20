import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonMenuButton,
  IonReorder,
  IonReorderGroup, IonRow,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ItemReorderEventDetail,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { AssertInternalError, Json, JsonElement } from '@pbkware/js-utils';
import { DataIvemId, DataMarket, ErrorCodeLogger, MarketIvemId, MarketsService, SecurityDataDefinition, SecurityDataItem } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { add, addSharp, removeSharp, swapVerticalSharp } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { PersonalisationService } from 'src/app/services/personalisation.service';
import { UnifyService } from 'src/app/services/unify.service';
import { SymbolSearchPageComponent } from 'src/app/shared/modal/symbol-search/symbol-search.page';
import { SelectionDataModel } from 'src/app/shared/models/data/selection.datamodel';
import { SymbolSearchTransferModel } from 'src/app/shared/models/transfer/symbol-search.transfermodel';
import { SecurityViewModel } from 'src/app/shared/models/view/security.viewmodel';
import { zDataIvemId } from 'src/app/shared/types/nullable-types';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';
import { SymbolListDataModel } from '../../shared/models/data/symbollist.datamodel';
import { WatchlistDataModel } from '../../shared/models/data/watchlist.datamodel';
import { RecentMovement } from '../../shared/types/shared-types';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.page.html',
  styleUrls: ['./stocks.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    OpenOrdersControlComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonLabel,
    IonContent,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonReorderGroup,
    IonItemSliding,
    IonItemOption,
    IonItemOptions,
    IonReorder,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
    IonBadge,
    IonFooter,
    IonItem,
    IonSelect,
    IonSelectOption,
  ],
})
export class StocksPageComponent implements OnDestroy {
  public dataAvailable: boolean;
  public doingReorder = false;
  public symbolListCode = "";
  public symbolListEditable = true;
  public availableWatchlists: SelectionDataModel[] = [];

  public customActionSheetOptions: unknown = {
    header: 'Watchlist',
    subHeader: 'Select a Watchlist to load',
    cssClass: 'standard-action-sheet'
  };

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _modalController: ModalController;
  private readonly _configSvc: ConfigurationService;
  private readonly _toastController: ToastController;
  private readonly _personalisationSvc: PersonalisationService;
  private readonly _localStorageSvc: LocalStorageService;
  private readonly _dataMarkets: MarketsService.Markets<DataMarket>;

  private readonly _cdr = inject(ChangeDetectorRef);

  private _symbolList: SymbolListDataModel[] = [];
  private _viewData: SecurityViewModel[] = [];
  private _activeSymbols: DataIvemId[] = [];

  private _preloadWatchlists: WatchlistDataModel[] = [
    { code: "custom", name: "Custom", editable: true },
    { code: "long", name: "A really really long name to test the length", editable: true },
    { code: "sandp1", name: "S&P/ASX 200", editable: false },
    { code: "sandp2", name: "S&P/ASX All Ordinaries", editable: false },
    { code: "sandp3", name: "S&P/ASX 50", editable: false },
    { code: "sandp4", name: "S&P/ASX 100", editable: false },
    { code: "sandp5", name: "S&P/ASX 20", editable: false },
  ];

  private readonly scrollingContent = viewChild.required<IonContent>('content');
  private readonly _reorderGroupViewChildSignal = viewChild<IonReorderGroup>('reorderGroup');

  constructor() {
    const modalController = inject(ModalController);
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const toastController = inject(ToastController);
    const configSvc = inject(ConfigurationService);
    const localStorageSvc = inject(LocalStorageService);
    const personalisationService = inject(PersonalisationService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._modalController = modalController;
    this._configSvc = configSvc;
    this._localStorageSvc = localStorageSvc;
    this._personalisationSvc = personalisationService;
    this._dataMarkets = unifySvc.marketsService.dataMarkets;

    this._toastController = toastController;

    this.dataAvailable = false;

    addIcons({
      addSharp,
      swapVerticalSharp,
      add,
      removeSharp,
    });

    const promise = this.loadInitialSymbollist();
    AssertInternalError.throwErrorIfPromiseRejected(promise, 'SPCLISL13132');
  }

  public get emptyList() {
    return (this._viewData.length === 0);
  }

  public get securitiesList() {
    return this._viewData;
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromSecurities();
  }

  toggleReorder() {
    const reorderGroup = this._reorderGroupViewChildSignal();
    if (reorderGroup === undefined) {
      this.doingReorder = false;
    } else {
      reorderGroup.disabled = !reorderGroup.disabled;
      this.doingReorder = !reorderGroup.disabled;
    }
  }

  async doReorder(evnt: CustomEvent<ItemReorderEventDetail> | undefined) {
    if (evnt) {
      // The `from` and `to` properties contain the index of the item
      // when the drag started and ended, respectively
      window.arclightLogger.logDebug(`Dragged from index ${ evnt.detail.from, 'to', evnt.detail.to}`);

      // var node = this._viewData[evnt.detail.from];
      // this._viewData.slice(evnt.detail.from, 1);
      // this._viewData.splice(evnt.detail.to, 0, node);
      this._viewData.splice(evnt.detail.to, 0, this._viewData.splice(evnt.detail.from, 1)[0]);
      this._activeSymbols.splice(evnt.detail.to, 0, this._activeSymbols.splice(evnt.detail.from, 1)[0]);
      await this.saveSymbolList();

      await this.presentToast();
      // window.motifLogger.logInfo(`Order: ${this._viewData.reduce((p, c) => p.concat(c.code).concat(","), "")});

      // Finish the reorder and position the item in the DOM based on
      // where the gesture ended. This method can also be called directly
      // by the reorder group
      evnt.detail.complete();
    }
  }

  async presentToast() {
    const toast = await this._toastController.create({
      message: 'Watchlist updated',
      duration: 2000
    });
    await toast.present();
  }

  async presentSymbolSearchModal() {
    const modal = await this._modalController.create({
      component: SymbolSearchPageComponent,
      cssClass: 'symbol-search-modal',
      backdropDismiss: false
    });

    const dismissPromise = modal.onDidDismiss();
    dismissPromise.then(
      (modalResult) => {
        if (modalResult.data) { // not cancelled
          const data = (modalResult.data as SymbolSearchTransferModel);
          const addPromise = this.addSymbol(data.litIvemId);
          AssertInternalError.throwErrorIfPromiseRejected(addPromise, 'SPSSAMA13132');
        }
      },
      (reason: unknown) => { AssertInternalError.createIfNotError(reason, 'SPPSSMD13132'); }
    );

    await modal.present();
  }

  async removeSymbol(symbolCode: string) {
    const parse = this._unifySvc.parseDataIvemId(symbolCode);
    if (parse.errorText === undefined) {
      window.arclightLogger.logDebug(`Remove symbol:  ${ symbolCode}`);
      this.unsubscribeFromSecurity(parse.marketIvemId);
      const idx = this._activeSymbols.findIndex((el) => el.code === parse.marketIvemId.code && el.exchange === parse.marketIvemId.exchange);
      if (idx > -1) {
        this._activeSymbols.splice(idx, 1);
        await this.saveSymbolList();
      }
    }
  }

  addWatchlist() {
    //
  }

  removeWatchlist() {
    //
  }

  readLastOrClosedChanged(sec: SecurityViewModel | undefined): RecentMovement {
    if (!sec) return RecentMovement.UNCHANGED;
    if (!sec.lastOrCloseChanged) return RecentMovement.UNCHANGED;
    return sec.lastOrCloseChanged;
  }

  private async loadInitialSymbollist(): Promise<void> {
    this._symbolList = [];
    this._viewData = [];

    let unknownMarketsKept: boolean;
    let dataIvemIdJsonArray: Json[];
    const symbolListJsonArray = await this._localStorageSvc.get(LocalStorageService.PreloadStocks) as Json[] | null;
    if (typeof symbolListJsonArray === 'object' && symbolListJsonArray !== null) {
      dataIvemIdJsonArray = symbolListJsonArray;
      unknownMarketsKept = true;
    } else {
      dataIvemIdJsonArray = this._configSvc.config.initialWatchlist;
      unknownMarketsKept = false;
    }

    if (dataIvemIdJsonArray.length === 0) {
      this._activeSymbols = [];
    } else {
      const jsonElementArray = dataIvemIdJsonArray.map(json => new JsonElement(json));
      const dataIvemIdsResult = MarketIvemId.tryCreateArrayFromJsonElementArray(
        this._dataMarkets,
        jsonElementArray,
        DataIvemId,
        true,
      );
      if (dataIvemIdsResult.isErr()) {
        ErrorCodeLogger.logConfigError('GLHFPDLW1444813', `${dataIvemIdsResult.error}: ${JSON.stringify(dataIvemIdJsonArray)}`, 400);
        this._activeSymbols = [];
      } else {
        const activeSymbols = dataIvemIdsResult.value;
        if (unknownMarketsKept) {
          this._activeSymbols = activeSymbols;
        } else {
          // Filter out symbols with unknown markets
          this._activeSymbols = activeSymbols.filter((symbol) => !symbol.market.unknown);
        }
      }
    }

    await this.saveSymbolList();
    this.loadSymbollist(this._activeSymbols);

    this.doingReorder = false;
    this.loadAvailableWatchlists(this._preloadWatchlists);
    this.symbolListCode = "custom";
  }

  private loadSymbollist(symbolList: zDataIvemId[]) {
    symbolList.forEach(sec => {
      if (sec !== undefined)
        this.subscribeToSecurity(sec);
    });
    if (!this.dataAvailable) {
      this.dataAvailable = true;
      this._cdr.markForCheck();
    }
  }

  private loadAvailableWatchlists(watchlists: WatchlistDataModel[]) {
    this.availableWatchlists = watchlists.map(wl => ({ code: wl.code, display: wl.name } as SelectionDataModel));
  }

  private subscribeToSecurity(dataIvemId: DataIvemId) {
    if (this._symbolList.find((el) => el.dataItem.dataIvemId.mapKey === dataIvemId.mapKey))
      return;

    const idx = this._viewData.push(new SecurityViewModel(this._bundledSvc, undefined)) - 1;

    const definition = new SecurityDataDefinition(dataIvemId.code, dataIvemId.marketZenithCode);
    const di = this._unifySvc.adi.subscribe(definition) as SecurityDataItem;
    const viewModel = SecurityViewModel.newFromDI(di, this._bundledSvc, undefined);
    this._viewData[idx] = viewModel;

    const wlModel = {
      dataItem: di,
      subidEndChanges: di.subscribeEndChangesEvent(() => {
        const index = this._viewData.findIndex((el) => el.mapKey === di.dataIvemId.mapKey);
        if (index >= 0) {
          this._viewData[index].loadFromDI(di);
        }
      }),
      subidFieldValuesChanged: di.subscribeFieldValuesChangedEvent((changes) => {
        const index = this._viewData/*.filter((vd) => (vd))*/.findIndex((el) => el.mapKey === di.dataIvemId.mapKey);
        if (index >= 0) {
          this._viewData[index].loadChanges(changes);
        }
      }),
    } as SymbolListDataModel;
    this._symbolList.push(wlModel);
  }

  private unsubscribeFromSecurity(litIvemId: zDataIvemId) {
    if (litIvemId === undefined)
      return;
    let idx = this._symbolList.findIndex((el) => { return (el.dataItem.dataIvemId.mapKey === litIvemId.mapKey); });
    if (idx >= 0) {
      const wlModel = this._symbolList[idx];
      wlModel.dataItem.unsubscribeEndChangesEvent(wlModel.subidEndChanges);
      wlModel.dataItem.unsubscribeFieldValuesChangedEvent(wlModel.subidFieldValuesChanged);
      this._unifySvc.adi.unsubscribe(wlModel.dataItem);
      this._symbolList.splice(idx, 1);
    }

    idx = this._viewData.findIndex((el) => el.mapKey === litIvemId.mapKey);
    if (idx >= 0) {
      this._viewData.splice(idx, 1);
    }
  }

  private async saveSymbolList() {
    const jsonElementArray = MarketIvemId.createJsonElementArray(this._activeSymbols);
    const jsonArray = jsonElementArray.map(jsonElement => jsonElement.json);
    await this._localStorageSvc.set(LocalStorageService.PreloadStocks, jsonArray);
    // const loadedSymbols: string[] = this._activeSymbols.map(s => {
    //   return this._unifySvc.dataIvemIdToGlobalIdentifier(s)
    // });
    // await this._localStorageSvc.set(LocalStorageService.PreloadStocks, loadedSymbols);
  }

  private async addSymbol(litIvemId: DataIvemId) {
    window.arclightLogger.logDebug(`Add symbol:  ${litIvemId.name}`);
    this.subscribeToSecurity(litIvemId)
    this._activeSymbols.push(litIvemId)
    await this.saveSymbolList();
    await this.scrollingContent().scrollToBottom();
  }

  private checkUnsubscribeFromSecurities() {
    for (const wlModel of this._symbolList) {
      wlModel.dataItem.unsubscribeEndChangesEvent(wlModel.subidEndChanges);
      wlModel.dataItem.unsubscribeFieldValuesChangedEvent(wlModel.subidFieldValuesChanged);
      this._unifySvc.adi.unsubscribe(wlModel.dataItem);
    }
  }
}

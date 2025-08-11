
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButtons,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonMenuButton,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MultiEvent, UsableListChangeTypeId } from '@pbkware/js-utils';
import { DataMarket, MarketsService } from '@plxtra/motif-core';
import { BundledService } from 'src/app/services/bundled.service';
import { ClockService } from 'src/app/services/clock.service';
import { UnifyService } from 'src/app/services/unify.service';
import { MarketViewModel } from 'src/app/shared/models/view/market.viewmodel';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';

@Component({
  selector: 'app-status',
  templateUrl: './status.page.html',
  styleUrls: ['./status.page.scss'],
  imports: [
    FormsModule,
    OpenOrdersControlComponent,
    IonHeader,
    IonContent,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonMenuButton,
    IonList,
    IonLabel,
    IonItem,
    IonItemDivider,
    IonGrid,
    IonRow,
    IonCol,
    IonAccordion,
    IonAccordionGroup,
    IonChip,
  ],
})
export class StatusPageComponent implements OnInit, OnDestroy {
  public dataAvailableMarkets = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _clockSvc: ClockService;
  private readonly _markets: MarketsService.Markets<DataMarket>;

  private _viewData: MarketViewModel[] = [];
  private _marketsListChangeSubscriptionId: MultiEvent.SubscriptionId;

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const clockSvc = inject(ClockService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._clockSvc = clockSvc;
    this._markets = this._unifySvc.marketsService.defaultExchangeEnvironmentDataMarkets;

    // let ex = this._unifySvc.symbolsManager.allowedExchangeIds;
    // let mk = this._unifySvc.symbolsManager.allowedMarketIds;
  }

  public get marketList() {
    if (this.dataAvailableMarkets) return this._viewData;
    return [];
  }

  ngOnInit() {
    this.subscribeToMarkets();
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromMarkets();
    this._viewData.forEach((vd) => vd.release());
  }

  private subscribeToMarkets(): void {
    this._viewData = this._markets.toArray().map((r) => MarketViewModel.newFromDI(this._clockSvc, this._bundledSvc, r)).sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
    this.dataAvailableMarkets = this._markets.usable;

    this._marketsListChangeSubscriptionId = this._markets.subscribeListChangeEvent((listChangeTypeId) => {
      if (listChangeTypeId === UsableListChangeTypeId.Usable || listChangeTypeId === UsableListChangeTypeId.Insert) {
        this._viewData = this._markets.toArray().map((r) => MarketViewModel.newFromDI(this._clockSvc, this._bundledSvc, r)).sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
        this.dataAvailableMarkets = this._markets.usable;
      }
    })
  }

  private checkUnsubscribeFromMarkets(): void {
    this._markets.unsubscribeListChangeEvent(this._marketsListChangeSubscriptionId);
    this._marketsListChangeSubscriptionId = undefined;
  }
}

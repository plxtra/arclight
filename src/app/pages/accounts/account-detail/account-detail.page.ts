
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { IonRouterLink, ModalController } from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import {
  BrokerageAccountBalancesDataDefinition,
  BrokerageAccountBalancesDataItem,
  BrokerageAccountHoldingsDataDefinition,
  BrokerageAccountHoldingsDataItem,
  BrokerageAccountOrdersDataDefinition,
  BrokerageAccountOrdersDataItem,
  BrokerageAccountsDataDefinition,
  BrokerageAccountsDataItem,
} from '@plxtra/motif-core';
import { ErrorIndicator } from 'src/app/errors/error-indicator';
import { GeneralError } from 'src/app/errors/general.error';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { NewOrderPageComponent } from 'src/app/shared/modal/order-pad/new-order/new-order.page';
import { NewOrderPlacementTransferModel } from 'src/app/shared/models/transfer/new-order-placement.transfermodel';
import { AccountViewModel } from 'src/app/shared/models/view/account.viewmodel';
import { BalanceViewModel } from 'src/app/shared/models/view/balance.viewmodel';
import { HoldingViewModel } from 'src/app/shared/models/view/holding.viewmodel';
import { OrderViewModel } from 'src/app/shared/models/view/order.viewmodel';
import { zIvemId } from 'src/app/shared/types/nullable-types';
import { OpenOrdersControlComponent } from '../../../components/open-orders-control/open-orders-control.component';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.page.html',
  styleUrls: ['./account-detail.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    RouterLink,
    IonRouterLink,
    OpenOrdersControlComponent
  ],
})
export class AccountDetailPageComponent implements OnInit, OnDestroy {
  public dataAvailableAccount = false;
  public dataAvailableBalances = false;
  public hasBalances = false;
  public dataAvailableHoldings = false;
  public hasHoldings = false;
  public dataAvailableOrders = false;
  public hasOrders = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _route: ActivatedRoute;
  private readonly _modalController: ModalController;

  private _accountZenithCode: string;
  private _tradingAccountsDI: BrokerageAccountsDataItem | undefined;
  private _subidTradingAccountEndChanges: MultiEvent.SubscriptionId;
  private _holdingsDI: BrokerageAccountHoldingsDataItem | undefined;
  private _subidHoldingsEndChanges: MultiEvent.SubscriptionId;
  private _balancesDI: BrokerageAccountBalancesDataItem | undefined;
  private _subidBalancesEndChanges: MultiEvent.SubscriptionId;
  private _ordersDI: BrokerageAccountOrdersDataItem | undefined;
  private _subidOrdersEndChanges: MultiEvent.SubscriptionId;

  private _viewDataAccount: AccountViewModel;
  private _viewDataBalances: BalanceViewModel[] = [];
  private _viewDataHoldings: HoldingViewModel[] = [];
  private _viewDataOrders: OrderViewModel[] = [];

  constructor(
    route: ActivatedRoute,
    unifySvc: UnifyService,
    bundeledSvc: BundledService,
    modalController: ModalController
  ) {
    this._route = route;
    this._unifySvc = unifySvc;
    this._bundledSvc = bundeledSvc;
    this._modalController = modalController;

    this._viewDataAccount = new AccountViewModel(this._bundledSvc);
  }

  public get accountZenithCode(): string {
    return this._accountZenithCode;
  }

  public get accountDetails() {
    if (this.dataAvailableAccount) return this._viewDataAccount;
    else return undefined;
  }

  public get balancesDetails() {
    if (this.dataAvailableBalances) return this._viewDataBalances;
    else return undefined;
  }

  public get holdingsDetails() {
    if (this.dataAvailableHoldings) return this._viewDataHoldings;
    else return undefined;
  }

  public get orderDetails() {
    if (this.dataAvailableOrders) return this._viewDataOrders;
    else return undefined;
  }

  ngOnInit() {
    this._accountZenithCode = this._route.snapshot.params.id as string;
    this.subscribeToTradingAccount();
    this.subscribeToBalances();
    this.subscribeToHoldings();
    this.subscribeToOrders();

    this.hasBalances = true;
    this.hasHoldings = true;
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromTradingAccount();
    this.checkUnsubscribeFromBalances();
    this.checkUnsubscribeFromHoldings();
    this.checkUnsubscribeFromOrders();
  }

  public clickNewBidOrder(ivemId: zIvemId) {
    if (ivemId===undefined) return;
    const props = {
      side: "buy",
      ivemId: ivemId,
      accountZenithCode: this._accountZenithCode
    } as NewOrderPlacementTransferModel;
    this.newOrder(props);
  }

  public clickNewAskOrder(ivemId: zIvemId) {
    if (ivemId===undefined) return;
    const props = {
      side: "sell",
      ivemId: ivemId,
      accountZenithCode: this._accountZenithCode
    } as NewOrderPlacementTransferModel

    this.newOrder(props);
  }

  private newOrder(props: NewOrderPlacementTransferModel) {
    const modalPromise = this._modalController.create({
      component: NewOrderPageComponent,
      componentProps: { primer: props },
      cssClass: 'new-order-modal',
      backdropDismiss: false
    });

    modalPromise.then(
      (modal) => {
        const modalDismissPromise = modal.onDidDismiss();
        modalDismissPromise.then(
          (modalResult) => {
            if (modalResult.data) {// not cancelled
              // const data = modalResult.data;
              // toast?
            }
          },
          (reason: unknown) => {
            throw AssertInternalError.createIfNotError(reason, 'HVMNOD33001');
          }
        );

        const presentPromise = modal.present();
        AssertInternalError.throwErrorIfPromiseRejected(presentPromise, 'HVMNOP33001');
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'HVMNOM33001'); }
    );
  }

  private subscribeToTradingAccount() {
    const definition = new BrokerageAccountsDataDefinition();
    this._tradingAccountsDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountsDataItem;

    this.loadViewDataAccount();

    this._subidTradingAccountEndChanges = this._tradingAccountsDI.subscribeEndChangesEvent(() => { this.loadViewDataAccount(); });
  }

  private subscribeToHoldings(): void {
    const definition = new BrokerageAccountHoldingsDataDefinition(this._accountZenithCode);
    this._holdingsDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountHoldingsDataItem;
    this.loadViewDataHoldings();

    this._subidHoldingsEndChanges = this._holdingsDI.subscribeEndChangesEvent(() => { this.loadViewDataHoldings(); });
  }

  private subscribeToBalances(): void {
    const definition = new BrokerageAccountBalancesDataDefinition(this._accountZenithCode);
    this._balancesDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountBalancesDataItem;
    this.loadViewDataBalances();

    this._subidBalancesEndChanges = this._balancesDI.subscribeEndChangesEvent(() => { this.loadViewDataBalances(); });
  }

  private subscribeToOrders(): void {
    const definition = new BrokerageAccountOrdersDataDefinition(this._accountZenithCode);
    this._ordersDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountOrdersDataItem;
    this.loadViewDataOrders();

    this._subidOrdersEndChanges = this._ordersDI.subscribeEndChangesEvent(() => { this.loadViewDataOrders(); })
  }

  private checkUnsubscribeFromTradingAccount(): void {
    if (this._tradingAccountsDI !== undefined) {
      this._tradingAccountsDI.unsubscribeEndChangesEvent(this._subidTradingAccountEndChanges);
      this._unifySvc.adi.unsubscribe(this._tradingAccountsDI);
    }
  }

  private checkUnsubscribeFromBalances(): void {
    if (this._balancesDI !== undefined) {
      this._balancesDI.unsubscribeEndChangesEvent(this._subidBalancesEndChanges);
      this._unifySvc.adi.unsubscribe(this._balancesDI);
    }
  }

  private checkUnsubscribeFromHoldings(): void {
    if (this._holdingsDI !== undefined) {
      this._holdingsDI.unsubscribeEndChangesEvent(this._subidHoldingsEndChanges);
      this._unifySvc.adi.unsubscribe(this._holdingsDI);
    }
  }

  private checkUnsubscribeFromOrders(): void {
    if (this._ordersDI !== undefined) {
      this._ordersDI.unsubscribeEndChangesEvent(this._subidOrdersEndChanges);
      this._unifySvc.adi.unsubscribe(this._ordersDI);
    }
  }

  private loadViewDataAccount(): void {
    const tradingAccountsDI = this._tradingAccountsDI;
    if (tradingAccountsDI === undefined) {
      throw new AssertInternalError('ADPLVDA40112');
    } else {
      const firstAcct = tradingAccountsDI.records
        .filter((a) => { return a.zenithCode === this._accountZenithCode; })
        .map((a) => AccountViewModel.newFromDI(a, this._bundledSvc))
        .pop();
      if (firstAcct === undefined)
        throw new GeneralError(ErrorIndicator.AE751501867, "AccountViewModel mapping");
      this._viewDataAccount = firstAcct;
      this.dataAvailableAccount = tradingAccountsDI.usable;
    }
  }

  private loadViewDataBalances(): void {
    const balancesDI = this._balancesDI;
    if (balancesDI === undefined) {
      throw new AssertInternalError('ADPLVDB40114');
    } else {
      this._viewDataBalances = balancesDI.records.map(r => BalanceViewModel.newFromDI(r, this._bundledSvc));
      this.dataAvailableBalances = balancesDI.usable;
      this.hasBalances = (balancesDI.records.length > 0);
    }
  }

  private loadViewDataHoldings(): void {
    const holdingsDI = this._holdingsDI;
    if (holdingsDI === undefined) {
      throw new AssertInternalError('ADPLVDH40134');
    } else {
      const viewDataHoldingPromises = holdingsDI.records.map(r => HoldingViewModel.newFromDI(r, this._bundledSvc));
      Promise.all(viewDataHoldingPromises).then(
        (viewDataHoldings) => {
          this._viewDataHoldings = viewDataHoldings;
          this.dataAvailableHoldings = holdingsDI.usable;
          this.hasHoldings = (holdingsDI.records.length > 0);
        },
        (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'HVMLLVDH40136'); }
      );
    }
  }

  private loadViewDataOrders() {
    const ordersDI = this._ordersDI;
    if (ordersDI === undefined) {
      throw new AssertInternalError('ADPLVDO40116');
    } else {
      this._viewDataOrders = [];
      ordersDI.records.forEach((r) => {
        const ovm = OrderViewModel.newFromDI(r, this._bundledSvc, undefined);
        this._viewDataOrders.push(ovm);
      });
      this.dataAvailableOrders = ordersDI.usable;
      this.hasOrders = (ordersDI.records.length > 0);
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import {
  Badness,
  BrokerageAccountBalancesDataDefinition,
  BrokerageAccountBalancesDataItem,
  BrokerageAccountsDataDefinition,
  BrokerageAccountsDataItem,
  DataIvemId,
  IvemId,
  OrderCommandResult,
  OrderPad,
  OrderRequestDataItem,
  OrderRequestError,
  OrderRequestErrorCode,
  OrderRequestErrorCodeId,
  OrderRequestResultId,
  OrderSideId,
  OrderTradeType,
  OrderTradeTypeId,
  OrderType,
  OrderTypeId,
  SecurityDataDefinition,
  SecurityDataItem,
  TimeInForce,
  TimeInForceId,
  TradingMarket
} from '@plxtra/motif-core';
import { endOfToday, parseISO } from 'date-fns';
import { Decimal } from "decimal.js-light";
import { addIcons } from 'ionicons';
import { alert, alertCircle, checkmark, checkmarkDone, chevronBack, chevronForward, close, ellipsisHorizontal } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { AccountSearchTransferModel } from 'src/app/shared/models/transfer/account-search.transfermodel';
import { NewOrderPlacementTransferModel } from 'src/app/shared/models/transfer/new-order-placement.transfermodel';
import { SymbolSearchTransferModel } from 'src/app/shared/models/transfer/symbol-search.transfermodel';
import { AccountViewModel } from 'src/app/shared/models/view/account.viewmodel';
import { BalanceViewModel } from 'src/app/shared/models/view/balance.viewmodel';
import { CoreEnumViewModel } from 'src/app/shared/models/view/core-enum.viewmodel';
import { SecurityViewModel } from 'src/app/shared/models/view/security.viewmodel';
import { DecimalCreate } from 'src/app/shared/types/decimal-create';
import { DecimalFormat } from 'src/app/shared/types/decimal-format';
import { zOrderRequestDataItem, zSecurityDataItem, zstring } from 'src/app/shared/types/nullable-types';
import { StandardSecurityControlComponent } from '../../../../components/standard-security-control/standard-security-control.component';
import { ToastService } from '../../../../services/toast.service';
import { AccountSearchPageComponent } from '../../account-search/account-search.page';
import { SymbolSearchPageComponent } from '../../symbol-search/symbol-search.page';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.page.html',
  styleUrls: ['./new-order.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    StandardSecurityControlComponent,
    IonHeader,
    IonContent,
    IonToolbar,
    IonButton,
    IonButtons,
    IonTitle,
    IonList,
    IonLabel,
    IonItem,
    IonFooter,
    IonBadge,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItemDivider,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonSkeletonText,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonInput,
    IonDatetime,
  ],
})
export class NewOrderPageComponent implements OnInit, OnDestroy {
  @Input() private primer: NewOrderPlacementTransferModel;

  public dataAvailableSecurity = false;
  public dataAvailableTradingAccounts = false;
  public dataAvailableBalances = false;
  public hasBalances = false;

  public sheetNumber = 0;
  public highlightingErrorText: boolean;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _modalController: ModalController;
  private readonly _toastService: ToastService;

  private _securityDI: zSecurityDataItem;
  private _subidSecurityEndChanges: MultiEvent.SubscriptionId;
  private _subidSecurityFieldValuesChanged: MultiEvent.SubscriptionId;
  private _viewDataSecurity: SecurityViewModel;

  private _tradingAccountsDI: BrokerageAccountsDataItem | undefined;
  private _subidTradingAccountsEndChanges: MultiEvent.SubscriptionId;
  private _viewDataTradingAccounts: AccountViewModel[] = [];

  private _balancesDI: BrokerageAccountBalancesDataItem | undefined;
  private _subidBalancesEndChanges: MultiEvent.SubscriptionId;
  private _viewDataBalances: BalanceViewModel[] = [];

  private _orderPad: OrderPad;
  private _orderPadCreated = false;
  private _subidOrderPadChanges: MultiEvent.SubscriptionId;

  private _orderRequestDI: zOrderRequestDataItem;
  private _subidOrderRequestBadnessChange: MultiEvent.SubscriptionId;
  private _subidOrderRequestCorrectnessChange: MultiEvent.SubscriptionId;
  private _placeOrderRequestActions: string[] = [];

  private _linkRoute: TradingMarket | undefined;

  private _availableSides: CoreEnumViewModel[] = [];
  private _availableTradingMarkets: TradingMarket[] = [];
  private _availableOrderTypes: CoreEnumViewModel[] = [];
  private _availableTimeInForces: CoreEnumViewModel[] = [];

  private _summaryValue: string;
  private _linkSide: zstring;
  private _linkOrderType: zstring;
  private _linkTimeInForce: zstring;
  private _linkExpiryDate: zstring;
  private _linkTotalQuantity: zstring;
  private _linkLimitValue: zstring;
  private _placedStatus = "";
  private _placedStatusGood = false;
  private _placedStatusBad = false;
  private _placedOrderId = "";
  private _placedBrokerage = "";
  private _placedTax = "";
  private _placedValue = "";

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const modalController = inject(ModalController);
    const toastService = inject(ToastService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._modalController = modalController;
    this._toastService = toastService;

    this.subscribeToTradingAccounts();
    this.highlightingErrorText = false;
    this._viewDataSecurity = new SecurityViewModel(this._bundledSvc, undefined);
    this.firstSheet();

    addIcons({
      close,
      ellipsisHorizontal,
      checkmark,
      alertCircle,
      alert,
      checkmarkDone,
      chevronForward,
      chevronBack,
    });
  }

  public get orderPad(): OrderPad {
    return this._orderPad;
  }

  public get anyErrors(): boolean {
    return (this._orderPad.getInvalidFieldIds().length > 0);
  }

  public get today8601(): string {
    return endOfToday().toISOString();
  }

  public get tradingSymbol(): SecurityViewModel | undefined {
    if (this.dataAvailableSecurity) return this._viewDataSecurity;
    return undefined;
  }

  public get accountBalances(): BalanceViewModel[] | undefined {
    if (this.dataAvailableBalances) return this._viewDataBalances;
    return undefined;
  }

  public get availableSides(): CoreEnumViewModel[] {
    return this._availableSides;
  }

  public get availableTradingMarkets(): TradingMarket[] {
    return this._availableTradingMarkets;
  }

  public get availableOrderTypes(): CoreEnumViewModel[] {
    return this._availableOrderTypes;
  }

  public get availableTimeInForces(): CoreEnumViewModel[] {
    return this._availableTimeInForces;
  }

  public get summaryValue(): string {
    return this._summaryValue;
  }

  public get linkSide(): zstring {
    return this._linkSide;
  }
  public set linkSide(v: zstring) {
    if (this._linkSide !== v) {
      this._linkSide = v;
      const sideId = OrderTradeType.tryNameToId(this._linkSide ?? "");
      if (sideId === OrderTradeTypeId.Buy) {
        this._orderPad.loadBuy();
      } else {
        this._orderPad.loadSell();
      }
      this._orderPad.sideId = sideId;
    }
  }
  public get linkSideDisplay() {
    if (this._orderPad.sideId === undefined) return "";
    return OrderTradeType.idToDisplay(this._orderPad.sideId);
  }

  public get linkOrderType(): zstring {
    return this._linkOrderType;
  }
  public set linkOrderType(v: zstring) {
    if (this._linkOrderType !== v) {
      this._linkOrderType = v;
      this._orderPad.orderTypeId = OrderType.tryNameToId(this._linkOrderType ?? "");
    }
  }
  public get linkOrderTypeError(): boolean {
    return !this._orderPad.isFieldValid(OrderPad.FieldId.OrderType);
  }
  public get linkOrderTypeErrorMessage(): string {
    if (!this.linkOrderTypeError) return "";
    const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.OrderType);
    return OrderPad.Field.StatusReason.idToDescription(id);
  }
  public get linkOrderTypeDisplay(): string {
    if (this._orderPad.orderTypeId === undefined) return "";
    return OrderType.idToDisplay(this._orderPad.orderTypeId);
  }

  public get linkTimeInForce(): zstring {
    return this._linkTimeInForce;
  }
  public set linkTimeInForce(v: zstring) {
    if (this._linkTimeInForce !== v) {
      this._linkTimeInForce = v;
      this._orderPad.timeInForceId = TimeInForce.tryNameToId(this._linkTimeInForce ?? "");
    }
  }
  public get linkTimeInForceError(): boolean {
    return !this._orderPad.isFieldValid(OrderPad.FieldId.TimeInForce);
  }
  public get linkTimeInForceErrorMessage(): string {
    if (!this.linkTimeInForceError) return "";
    const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.TimeInForce);
    return OrderPad.Field.StatusReason.idToDescription(id);
  }
  public get linkTimeInForceDisplay(): string {
    if (this._orderPad.timeInForceId === undefined) return "";
    return TimeInForce.idToDisplay(this._orderPad.timeInForceId);
  }

  public get linkExpiryDate(): zstring {
    return this._linkExpiryDate;
  }
  public set linkExpiryDate(v: zstring) {
    if (this._linkExpiryDate !== v) {
      this._linkExpiryDate = v;
      const dt = parseISO(this._linkExpiryDate ?? "");
      this._orderPad.expiryDate = dt;
    }
  }
  public get linkExpiryDateFormatted(): string {
    if (this.linkExpiryDateDisabled || this._orderPad.expiryDate === undefined) return "";
    return this._orderPad.expiryDate.toLocaleDateString();
  }
  public get linkExpiryDateDisabled(): boolean {
    return this._orderPad.isFieldDisabled(OrderPad.FieldId.ExpiryDate)
  }
  public get linkExpiryDateError(): boolean {
    return !this._orderPad.isFieldValid(OrderPad.FieldId.ExpiryDate);
  }
  public get linkExpiryDateErrorMessage(): string {
    if (!this.linkExpiryDateError) return "";
    const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.ExpiryDate);
    return OrderPad.Field.StatusReason.idToDescription(id);
  }

  public get linkTotalQuantity(): zstring {
    return this._linkTotalQuantity;
  }
  public set linkTotalQuantity(v: zstring) {
    if (this._linkTotalQuantity !== v) {
      this._linkTotalQuantity = v;
      if (this._linkTotalQuantity === undefined) {
        this._orderPad.totalQuantity = undefined;
      } else {
        const d = DecimalCreate.newDecimal(this._linkTotalQuantity);
        this._orderPad.totalQuantity = d.toNumber();
      }
    }
  }
  public get linkTotalQuantityError(): boolean {
    return !this._orderPad.isFieldValid(OrderPad.FieldId.TotalQuantity);
  }
  public get linkTotalQuantityErrorMessage(): string {
    if (!this.linkTotalQuantityError) return "";
    const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.TotalQuantity);
    return OrderPad.Field.StatusReason.idToDescription(id);
  }
  public get linkTotalQuantityDisplay(): string {
    if (this._orderPad.totalQuantity === undefined) return ""
    return this._orderPad.totalQuantity.toLocaleString();
  }

  public get linkLimitValue(): zstring {
    return this._linkLimitValue;
  }
  public set linkLimitValue(v: zstring | null) {
    if (v === null) {
      v = undefined;
    }
    if (this._linkLimitValue !== v) {
      this._linkLimitValue = v;
      this._orderPad.limitValue = DecimalCreate.newZDecimal(this._linkLimitValue);
    }
  }
  public get linkLimitValueDisabled(): boolean {
    return this._orderPad.isFieldDisabled(OrderPad.FieldId.LimitValue)
  }
  public get linkLimitValueError(): boolean {
    return !this._orderPad.isFieldValid(OrderPad.FieldId.LimitValue);
  }
  public get linkLimitValueErrorMessage(): string {
    if (!this.linkLimitValueError) return "";
    const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.LimitValue);
    return OrderPad.Field.StatusReason.idToDescription(id);
  }
  public get linkLimitValueDisplay(): string {
    if (this._orderPad.limitValue === undefined) return "";
    return DecimalFormat.formatPrice(this._orderPad.limitValue);
  }

  public get tradingMarket(): TradingMarket | undefined {
    return this._linkRoute;
  }
  public set tradingMarket(v: TradingMarket | undefined) {
    if (this._linkRoute !== v) {
      this._linkRoute = v;
      const route = this._orderPad.allowedTradingMarkets.filter(r => r === this._linkRoute).pop();
      if (route !== undefined)
        this._orderPad.tradingMarket = route;
    }
  }
  public get tradingMarketDisplay() {
    return this._orderPad.tradingMarket.display;
  }

  public get placedStatus(): string {
    return this._placedStatus;
  }

  public get placedStatusGood(): boolean {
    return this._placedStatusGood;
  }

  public get placedStatusBad(): boolean {
    return this._placedStatusBad;
  }

  public get placedOrderId(): string {
    return this._placedOrderId;
  }

  public get placedBrokerage(): string {
    return this._placedBrokerage;
  }

  public get placedTax(): string {
    return this._placedTax;
  }

  public get placedValue(): string {
    return this._placedValue;
  }

  public get placeOrderRequestErrors(): string[] {
    return this._placeOrderRequestActions;
  }

  public get sideColour(): string {
    switch (this._orderPad.sideId) {
      case OrderTradeTypeId.Buy:
        return "danger";
      case OrderTradeTypeId.Sell:
        return "success";
      default:
        // exotics
        return "tertiary";
    }
  }

  public sideSegmentStyle(name: string): string {
    switch (name) {
      case OrderTradeType.idToName(OrderTradeTypeId.Buy):
        return "new-order-buy";
      case OrderTradeType.idToName(OrderTradeTypeId.Sell):
        return "new-order-sell";
      default:
        // exotics
        return "new-order-exotic";
    }
  }

  ngOnInit() {
    this.primeOrder();
  }

  ngOnDestroy() {
    if (this._orderPadCreated) {
      this._orderPad.unsubscribeFieldsChangedEvent(this._subidOrderPadChanges);
      this._orderPad.finalise();
      this._orderPadCreated = false;
    }
    this.checkUnsubscribeFromOrderRequest();
    this.checkUnsubscribeFromSecurity();
    this.checkUnsubscribeFromBalances();
    this.checkUnsubscribeFromTradingAccounts();
  }

  public isSheetActive(sheetNumber: number): boolean {
    return (sheetNumber === this.sheetNumber);
  }

  public nextSheet() {
    this.sheetNumber += 1;
    if (this.sheetNumber === 3) {
      this.placeOrder();
    }
  }

  public priorSheet() {
    this.sheetNumber -= 1;
  }

  public resetPad() {
    if (this._orderPadCreated) {
      // keep prior Account, Symbol, and Side
      this.primer.accountZenithCode = this._orderPad.accountZenithCode;
      this.primer.ivemId = this._orderPad.tradingIvemId?.ivemId;
      switch (OrderTradeType.idToOrderSideId(this._orderPad.sideId ?? OrderTradeTypeId.Buy)) {
        case OrderSideId.Ask:
          this.primer.side = "sell";
          break;
        case OrderSideId.Bid:
          this.primer.side = "buy"
          break;
      }
    }
    this.firstSheet();
    this.primeOrder();
  }

  public highlightErrors(activate: boolean) {
    this.highlightingErrorText = activate;
  }

  dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'NOPDM45123');
  }

  firstSheet() {
    if (this._orderPadCreated) {
      this._orderPad.unsubscribeFieldsChangedEvent(this._subidOrderPadChanges);
      this._orderPad.finalise();
      this.checkUnsubscribeFromSecurity();
      this._orderPadCreated = false;
    }

    this._linkSide = undefined;
    this._linkExpiryDate = undefined;
    this._linkLimitValue = undefined;
    this._linkOrderType = undefined;
    this._linkRoute = undefined;
    this._linkTimeInForce = undefined;
    this._linkTotalQuantity = undefined;
    this._availableSides = [];
    this._availableTradingMarkets = [];
    this._availableOrderTypes = [];
    this._availableTimeInForces = [];

    this._placedStatus = "";
    this._placeOrderRequestActions = [];

    this._orderPad = new OrderPad(this._unifySvc.decimalFactory, this._unifySvc.marketsService, this._unifySvc.coreService.symbolDetailCacheService, this._unifySvc.adi);
    this._orderPadCreated = true;
    this._orderPad.resetModified();
    this._subidOrderPadChanges = this._orderPad.subscribeFieldsChangedEvent((fields) => this.fieldChangeHandler(fields));

    // defaults
    this.linkSide = OrderTradeType.idToName(OrderTradeTypeId.Buy);
    this.linkOrderType = OrderType.idToName(OrderTypeId.Limit);
    this.linkTimeInForce = TimeInForce.idToName(TimeInForceId.GoodTillCancel);

    this.sheetNumber = 1;
  }

  public async lookupTradingAccount() {
    const modal = await this._modalController.create({
      component: AccountSearchPageComponent,
      cssClass: 'account-search-modal',
      backdropDismiss: false
    });

    const dismissPromise = modal.onDidDismiss();
    dismissPromise.then(
      (modalResult) => {
        if (modalResult.data) { // not cancelled
          const data = (modalResult.data as AccountSearchTransferModel);
          this._orderPad.accountZenithCode = data.accountZenithCode;
        }
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'NOPLMOD45123');}
    );

    await modal.present();
  }

  public async lookupSymbol() {
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
          this.changeIvemId(data.litIvemId.ivemId);
        }
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'NOPLS45123');}
    );

    await modal.present();
  }

  private primeOrder() {
    switch (this.primer.side) {
      case "sell":
        this.linkSide = OrderTradeType.idToName(OrderTradeTypeId.Sell);
        break;
      case "buy":
      default:
        this.linkSide = OrderTradeType.idToName(OrderTradeTypeId.Buy);
        break;
    }

    if (this.primer.ivemId) {
      this.changeIvemId(this.primer.ivemId);
    }

    if (this.primer.accountZenithCode) {
      this._orderPad.accountZenithCode = this.primer.accountZenithCode
    }
  }

  private fieldChangeHandler(fields: OrderPad.FieldId[]) {
    fields.forEach((f) => {
      switch (f) {
        case OrderPad.FieldId.Symbol: {
          const tradingIvemId = this._orderPad.tradingIvemId;
          if (tradingIvemId === undefined) {
            throw new AssertInternalError('NOPFCH45123');
          } else {
            const litIvemId = this._unifySvc.symbolsService.tryGetBestDataIvemIdFromTradingIvemId(tradingIvemId);
            if (litIvemId === undefined) {
              this._availableTradingMarkets = [];
              this._linkRoute = undefined;
            } else {
              this.subscribeToSecurity(litIvemId);
              this._availableTradingMarkets = [...this._orderPad.allowedTradingMarkets];
              if (this._availableTradingMarkets.length > 0) {
                this._linkRoute = tradingIvemId.market;
              } else {
                this._linkRoute = undefined;
              }
            }
            this.evalAvailableSides();
            this.evalAvailableOrderTypes();
            this.evalAvailableTimeInForce();
            this.updateSummary();
            break;
          }
        }
        case OrderPad.FieldId.Account: {
          const account = this._orderPad.account;
          if (account === undefined) {
            this.checkUnsubscribeFromBalances();
          } else {
            this.subscribeToBalances(account.zenithCode);
          }
          this.evalAvailableSides();
          this.updateSummary();
          break;
        }
        case OrderPad.FieldId.LimitValue:
        case OrderPad.FieldId.Side:
        case OrderPad.FieldId.TotalQuantity:
        case OrderPad.FieldId.OrderType:
          this.updateSummary();
          break;
      }
    });
  }

  private evalAvailableSides(): void {
    this._availableSides = this._orderPad.allowedSideIds.map(id => {
      const n = new CoreEnumViewModel();
      n.name = OrderTradeType.idToName(id);
      n.display = OrderTradeType.idToAbbreviation(id);
      return n;
    });
  }

  private evalAvailableOrderTypes(): void {
    this._availableOrderTypes = this._orderPad.allowedOrderTypeIds.map(id => {
      const n = new CoreEnumViewModel();
      n.name = OrderType.idToName(id);
      n.display = OrderType.idToDisplay(id);
      return n;
    });
  }

  private evalAvailableTimeInForce(): void {
    this._availableTimeInForces = this._orderPad.allowedTimeInForceIds.map(id => {
      const n = new CoreEnumViewModel();
      n.name = TimeInForce.idToName(id);
      n.display = TimeInForce.idToDisplay(id);
      return n;
    });
  }

  private changeIvemId(ivemId: IvemId) {
    this._linkRoute = undefined;
    const tradingIvemId = this._unifySvc.symbolsService.tryGetDefaultTradingIvemIdFromIvemId(ivemId);
    if (tradingIvemId === undefined) {
      this._toastService.showToast(`Instrument can not be traded: ${this._unifySvc.symbolsService.ivemIdToDisplay(ivemId)}`, 1500, 'alert-circle', 'secondary');
    } else {
      this._orderPad.tradingIvemId = tradingIvemId;
    }
  }

  private updateSummary() {
    const summQty = new Decimal(this._orderPad.totalQuantity ?? 0);
    let summValue: Decimal | undefined;

    if (this._orderPad.orderTypeId === OrderTypeId.Limit) {
      summValue = this._orderPad.limitValue;
    } else if (this._viewDataSecurity.auctionPrice) {
      summValue = this._viewDataSecurity.auctionPrice;
    } else if (this._orderPad.sideId === OrderTradeTypeId.Buy) {
      summValue = this._viewDataSecurity.bestAsk;
    } else {
      summValue = this._viewDataSecurity.bestBid;
    }

    this._summaryValue = summValue ? DecimalFormat.formatPrice(summQty.times(summValue.toNumber())) : "---.--";
  }

  private placeOrder() {
    this._placedStatusBad = false;
    this._placedStatusGood = false;
    this._placedStatus = "Processing...";
    this.checkUnsubscribeFromOrderRequest();

    this._orderPad.setReadonly();
    const definition = this._orderPad.createOrderRequestDataDefinition();
    this._orderPad.setSent();
    this._orderRequestDI = this._unifySvc.adi.subscribe(definition) as OrderRequestDataItem;
    this._subidOrderRequestCorrectnessChange = this._orderRequestDI.subscribeCorrectnessChangedEvent(() => this.handleOrderRequestCorrectnessChangeEvent());
    this._subidOrderRequestBadnessChange = this._orderRequestDI.subscribeBadnessChangedEvent(() => this.handleOrderRequestBadnessChangedEvent());
  }

  private handleOrderRequestBadnessChangedEvent() {
    const orderRequestDI = this._orderRequestDI;
    if (orderRequestDI === undefined) {
      throw new AssertInternalError('NOPHORE45123');
    } else {
      this._placedStatusBad = true;
      this._placedStatusGood = false;
      this._placedStatus = Badness.Reason.idToDisplay(orderRequestDI.badness.reasonId);
      this._placeOrderRequestActions.push(this._placedStatus);
    }
  }

  private mapErrorDisplay(ore: OrderRequestError): string {
    if (ore.codeId === OrderRequestErrorCodeId.Unknown) return ore.code;
    return OrderRequestErrorCode.idToDisplay(ore.codeId);
  }

  private handleOrderRequestCorrectnessChangeEvent() {
    const orderRequestDI = this._orderRequestDI;
    if (orderRequestDI === undefined) {
      throw new AssertInternalError('NOPHORCCE45123');
    } else {
      if (orderRequestDI.incubated) {
        if (orderRequestDI.error) {
          this._placeOrderRequestActions = [orderRequestDI.errorText];
          this._placedStatusBad = true;
          this._placedStatusGood = false;
          this._placedStatus = "Communications error";
          const displayErrors = orderRequestDI.errors?.map(r => this.mapErrorDisplay(r));
          if (displayErrors !== undefined)
            this._placeOrderRequestActions.push(...displayErrors);
        } else {
          this._placedStatus = OrderCommandResult.idToDisplay(orderRequestDI.result);
          if (orderRequestDI.errors) {
            this._placeOrderRequestActions.push(...orderRequestDI.errors.map(r => this.mapErrorDisplay(r)));
          }

          if (orderRequestDI.result === OrderRequestResultId.Success) {
            this._placedStatusBad = false;
            this._placedStatusGood = true;
          } else {
            this._placedStatusBad = true;
            this._placedStatusGood = false;
          }

          this._placedBrokerage = DecimalFormat.formatMoney(orderRequestDI.estimatedBrokerage);
          this._placedTax = DecimalFormat.formatMoney(orderRequestDI.estimatedTax);
          this._placedValue = DecimalFormat.formatMoney(orderRequestDI.estimatedValue);
          if (orderRequestDI.order) {
            this._placedOrderId = orderRequestDI.order.id;
          }
        }

        this.checkUnsubscribeFromOrderRequest();
      }
    }
  }

  private subscribeToSecurity(litIvemId: DataIvemId) {
    this.checkUnsubscribeFromSecurity();

    const definition = new SecurityDataDefinition(litIvemId.code, litIvemId.marketZenithCode);
    this._securityDI = this._unifySvc.adi.subscribe(definition) as SecurityDataItem;
    this._viewDataSecurity = new SecurityViewModel(this._bundledSvc, undefined);
    this.loadViewDataSecurity();
    this._subidSecurityEndChanges = this._securityDI.subscribeEndChangesEvent(() => this.loadViewDataSecurity());
    this._subidSecurityFieldValuesChanged = this._securityDI.subscribeFieldValuesChangedEvent((changes) => this._viewDataSecurity.loadChanges(changes));
  }

  private loadViewDataSecurity() {
    this._viewDataSecurity.loadFromDI(this._securityDI);
    this.dataAvailableSecurity = this._securityDI?.usable ?? false;
    this.updateSummary();
  }

  private checkUnsubscribeFromSecurity(): void {
    if (this._securityDI !== undefined) {
      this._securityDI.unsubscribeEndChangesEvent(this._subidSecurityEndChanges);
      this._securityDI.unsubscribeFieldValuesChangedEvent(this._subidSecurityFieldValuesChanged);
      this._unifySvc.adi.unsubscribe(this._securityDI);
      this.dataAvailableSecurity = false;
      this._securityDI = undefined;
    }
  }

  private subscribeToBalances(accountZenithCode: string): void {
    this.checkUnsubscribeFromBalances();

    const definition = new BrokerageAccountBalancesDataDefinition(accountZenithCode);
    const balancesDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountBalancesDataItem;
    this._balancesDI = balancesDI
    this.loadViewDataBalances(balancesDI);

    this._subidBalancesEndChanges = balancesDI.subscribeEndChangesEvent(() => { this.loadViewDataBalances(balancesDI); });
  }

  private loadViewDataBalances(balancesDI: BrokerageAccountBalancesDataItem): void {
    this._viewDataBalances = balancesDI.records.map(r => BalanceViewModel.newFromDI(r, this._bundledSvc));
    this.dataAvailableBalances = balancesDI.usable;
    this.hasBalances = (balancesDI.records.length > 0);
  }

  private checkUnsubscribeFromBalances(): void {
    if (this._balancesDI !== undefined) {
      this.dataAvailableBalances = false;
      this._balancesDI.unsubscribeEndChangesEvent(this._subidBalancesEndChanges);
      this._unifySvc.adi.unsubscribe(this._balancesDI);
    }
  }

  private checkUnsubscribeFromOrderRequest(): void {
    if (this._orderRequestDI !== undefined) {
      this._orderRequestDI.unsubscribeBadnessChangedEvent(this._subidOrderRequestBadnessChange);
      this._orderRequestDI.unsubscribeCorrectnessChangedEvent(this._subidOrderRequestCorrectnessChange)
      this._unifySvc.adi.unsubscribe(this._orderRequestDI);
      this._orderRequestDI = undefined;
    }
  }

  private subscribeToTradingAccounts() {
    const definition = new BrokerageAccountsDataDefinition();
    const tradingAccountsDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountsDataItem;
    this._tradingAccountsDI = tradingAccountsDI;

    this.loadAccountData(tradingAccountsDI);

    this._subidTradingAccountsEndChanges = tradingAccountsDI.subscribeEndChangesEvent(() => this.loadAccountData(tradingAccountsDI));
  }

  private loadAccountData(tradingAccountsDI: BrokerageAccountsDataItem) {
    this._viewDataTradingAccounts = tradingAccountsDI.records.map(r => AccountViewModel.newFromDI(r, this._bundledSvc));
    this.dataAvailableTradingAccounts = tradingAccountsDI.usable;
  }

  private checkUnsubscribeFromTradingAccounts() {
    if (this._tradingAccountsDI !== undefined) {
      this._tradingAccountsDI.unsubscribeEndChangesEvent(this._subidTradingAccountsEndChanges);
      this._unifySvc.adi.unsubscribe(this._tradingAccountsDI);
    }
  }
}

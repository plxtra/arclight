import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent, delay1Tick } from '@pbkware/js-utils';
import {
  Badness,
  BrokerageAccountBalancesDataDefinition,
  BrokerageAccountBalancesDataItem,
  DataIvemId,
  Order,
  OrderCommandResult,
  OrderPad,
  OrderRequestDataItem,
  OrderRequestError,
  OrderRequestErrorCode,
  OrderRequestErrorCodeId,
  OrderRequestResultId,
  OrderSideId,
  SecurityDataDefinition,
  SecurityDataItem,
  TradingIvemId,
} from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { alert, alertCircle, checkmark, checkmarkDone, chevronForward, close } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { SingleOrderCollector } from 'src/app/shared/collectors/single-order-collector';
import { AmendOrderPlacementTransferModel } from 'src/app/shared/models/transfer/amend-order-placement.transfermodel';
import { BalanceViewModel } from 'src/app/shared/models/view/balance.viewmodel';
import { OrderViewModel } from 'src/app/shared/models/view/order.viewmodel';
import { SecurityViewModel } from 'src/app/shared/models/view/security.viewmodel';
import { DecimalCreate } from 'src/app/shared/types/decimal-create';
import { DecimalFormat } from 'src/app/shared/types/decimal-format';
import { StandardSecurityControlComponent } from '../../../../components/standard-security-control/standard-security-control.component';

@Component({
  selector: 'app-amend-order',
  templateUrl: './amend-order.page.html',
  styleUrls: ['./amend-order.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StandardSecurityControlComponent,
  ],
})
export class AmendOrderPageComponent implements OnInit, OnDestroy {
  @Input() private primer: AmendOrderPlacementTransferModel;

  public dataAvailableOrder: boolean;
  public dataAvailableSecurity: boolean;
  public dataAvailableBalances: boolean;
  public hasBalances: boolean;

  public sheetNumber: number;
  public highlightingErrorText: boolean;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _modalController: ModalController;
  private readonly _singleOrderCollector: SingleOrderCollector;
  private _subSourceOrderChanged: Subscription;

  private _securityDI: SecurityDataItem | undefined;
  private _subidSecurityEndChanges: MultiEvent.SubscriptionId;
  private _subidSecurityFieldValuesChanged: MultiEvent.SubscriptionId;
  private _viewDataSecurity: SecurityViewModel | undefined;
  private _orderDetails: OrderViewModel | undefined

  private _balancesDI: BrokerageAccountBalancesDataItem | undefined;
  private _subidBalancesEndChanges: MultiEvent.SubscriptionId;
  private _viewDataBalances: BalanceViewModel[];

  private _orderPad: OrderPad | undefined;
  private _subidOrderPadChanges: MultiEvent.SubscriptionId;

  private _orderRequestDI: OrderRequestDataItem | undefined;
  private _subidOrderRequestBadnessChange: MultiEvent.SubscriptionId;
  private _subidOrderRequestCorrectnessChange: MultiEvent.SubscriptionId;
  private _placeOrderRequestActions: string[];

  private _viewSource: Order | undefined;

  private _linkTotalQuantity: string | undefined;
  private _linkLimitValue: string | undefined;
  private _updatedValue: string | undefined;
  private _deltaValue: string | undefined;
  private _placedStatus: string | undefined;
  private _placedOrderId: string;
  private _placedStatusGood: boolean;
  private _placedStatusBad: boolean;

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const modalController = inject(ModalController);
    const singleOrderCollector = inject(SingleOrderCollector);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._modalController = modalController;
    this._singleOrderCollector = singleOrderCollector;

    this._subSourceOrderChanged = this._singleOrderCollector.sourceOrderChangeEventEmitter.subscribe(() => {
      window.arclightLogger.logDebug(`Source order changed ${ this._singleOrderCollector.sourceOrder?.id}`);
      const viewSource = this._singleOrderCollector.sourceOrder;
      this.viewSource = viewSource;
      if (viewSource !== undefined) {
        this._orderDetails = this._singleOrderCollector.orderView;
        const routeMarket = viewSource.routeMarket;
        if (routeMarket !== undefined) {
          const tradingIvemId = new TradingIvemId(viewSource.code, routeMarket);
          const dataIvemId = this._unifySvc.symbolsService.tryGetBestDataIvemIdFromMarketIvemId(tradingIvemId);
          if (dataIvemId !== undefined) {
            this.subscribeToSecurity(dataIvemId);
          }
        }
        this.dataAvailableOrder = true;
      } else {
        this._orderDetails = undefined;
        this.viewSource = undefined;
        this.dataAvailableOrder = false;
      }
    });
    this.highlightingErrorText = false;

    addIcons({
      close,
      alertCircle,
      checkmark,
      alert,
      checkmarkDone,
      chevronForward,
    });
  }

  public get orderDetails(): OrderViewModel | undefined { return this._orderDetails; }

  public get viewSource(): Order | undefined {
    return this._viewSource;
  }
  public set viewSource(v: Order | undefined) {
    if (this._viewSource !== v) {
      this._viewSource = v;
      if (this._orderPad !== undefined) {
        this._orderPad.unsubscribeFieldsChangedEvent(this._subidOrderPadChanges);
        this._orderPad.finalise();
        this._orderPad = undefined;
      }
      if (this._viewSource !== undefined) {
        const orderPad = new OrderPad(this._unifySvc.decimalFactory, this._unifySvc.marketsService, this._unifySvc.coreService.symbolDetailCacheService, this._unifySvc.adi);
        this._orderPad = orderPad;
        this._orderPad.resetModified();
        this._orderPad.loadAmendFromOrder(this._viewSource);
        this.linkLimitValue = orderPad.limitValue?.toString();
        this.linkTotalQuantity = orderPad.totalQuantity?.toString();
        this.subscribeToBalances(this._viewSource.account.zenithCode);
      }
    }
  }

  public get tradingSymbol(): SecurityViewModel | undefined {
    if (this.dataAvailableSecurity) return this._viewDataSecurity;
    return undefined;
  }

  public get accountBalances(): BalanceViewModel[] | undefined {
    if (this.dataAvailableBalances) return this._viewDataBalances;
    return undefined;
  }
  public get sideColour(): string {
    if (!this.viewSource) return "";

    switch (this.viewSource.sideId) {
      case OrderSideId.Bid:
        return "danger";
      case OrderSideId.Ask:
        return "success";
    }
  }

  public get linkTotalQuantity(): string | undefined{
    return this._linkTotalQuantity;
  }
  public set linkTotalQuantity(v: string | undefined) {
    if (this._linkTotalQuantity !== v) {
      this._linkTotalQuantity = v;
      if (this._orderPad === undefined) {
        throw new AssertInternalError('AOPLMLV00123', "Order pad is undefined, cannot set linkLimitValue");
      } else {
        if (!this._linkTotalQuantity) {
          this._orderPad.totalQuantity = undefined;
        } else {
          const d = DecimalCreate.newDecimal(this._linkTotalQuantity);
          this._orderPad.totalQuantity = d.toNumber();
        }
        this.calcDelta();
      }
    }
  }
  public get linkTotalQuantityError(): boolean {
    return this._orderPad === undefined ? false : !this._orderPad.isFieldValid(OrderPad.FieldId.TotalQuantity);
  }
  public get linkTotalQuantityErrorMessage(): string | undefined {
    if (!this.linkTotalQuantityError) {
      return undefined;
    } else {
      if (this._orderPad === undefined) {
        throw new AssertInternalError('AOPLTQEM00124', "Order pad is undefined, cannot get linkTotalQuantityErrorMessage");
      } else {
        const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.TotalQuantity);
        return OrderPad.Field.StatusReason.idToDescription(id);
      }
    }
  }
  public get linkTotalQuantityDisplay(): string | undefined{
    return this._orderPad?.totalQuantity?.toLocaleString();
  }

  public get linkLimitValue(): string | undefined{
    return this._linkLimitValue;
  }
  public set linkLimitValue(v: string | undefined) {
    if (this._linkLimitValue !== v) {
      this._linkLimitValue = v;
      if (this._orderPad === undefined) {
        throw new AssertInternalError('AOPLMLV00123', "Order pad is undefined, cannot set linkLimitValue");
      } else {
        if (this._linkLimitValue === undefined || this._linkLimitValue === "") {
          this._orderPad.limitValue = undefined;
        }
        this._orderPad.limitValue = DecimalCreate.newZDecimal(this._linkLimitValue);
        this.calcDelta();
      }
    }
  }
  public get linkLimitValueDisabled(): boolean {
    return this._orderPad === undefined ? false : this._orderPad.isFieldDisabled(OrderPad.FieldId.LimitValue);
  }
  public get linkLimitValueError(): boolean {
    return this._orderPad === undefined ? false : !this._orderPad.isFieldValid(OrderPad.FieldId.LimitValue);
  }
  public get linkLimitValueErrorMessage(): string | undefined {
    if (!this.linkLimitValueError) {
      return undefined;
    } else {
      if (this._orderPad === undefined) {
        throw new AssertInternalError('AOPLLVEM00123');
      } else {
        const id = this._orderPad.getFieldStatusReasonId(OrderPad.FieldId.LimitValue);
        return OrderPad.Field.StatusReason.idToDescription(id);
      }
    }
  }
  public get linkLimitValueDisplay(): string {
    return DecimalFormat.formatPrice(this._orderPad?.limitValue);
  }

  public get anyErrors(): boolean {
    if (this._orderPad === undefined) return true;
    return (this._orderPad.getInvalidFieldIds().length > 0);
  }

  public get updatedValue(): string | undefined {
    return this._updatedValue;
  }

  public get deltaValue(): string | undefined {
    return this._deltaValue;
  }

  public get placedStatus(): string | undefined {
    return this._placedStatus;
  }

  public get placedOrderId(): string {
    return this._placedOrderId;
  }

  public get placedStatusGood(): boolean {
    return this._placedStatusGood;
  }

  public get placedStatusBad(): boolean {
    return this._placedStatusBad;
  }

  public get placeOrderRequestErrors(): string[] {
    return this._placeOrderRequestActions;
  }

  ngOnInit() {
    this.firstSheet();
  }

  ngOnDestroy() {
    this._subSourceOrderChanged.unsubscribe();

    if (this._orderPad) {
      this._orderPad.unsubscribeFieldsChangedEvent(this._subidOrderPadChanges);
      this._orderPad.finalise();
    }
    this.checkUnsubscribeFromOrderRequest();
    this.checkUnsubscribeFromSecurity();
    this.checkUnsubscribeFromBalances();
  }

  public isSheetActive(sheetNumber: number): boolean {
    return (sheetNumber === this.sheetNumber);
  }

  public nextSheet() {
    this.sheetNumber += 1;
    if (this.sheetNumber === 2) {
      this.placeOrder();
    }
  }

  public priorSheet() {
    this.sheetNumber -= 1;
  }

  public firstSheet() {
    if (this._orderPad) {
      this._orderPad.unsubscribeFieldsChangedEvent(this._subidOrderPadChanges);
      this._orderPad.finalise();
    }
    this.checkUnsubscribeFromOrderRequest();
    this.checkUnsubscribeFromSecurity();

    this._placedStatus = undefined;
    this._placeOrderRequestActions = [];

    // defaults
    this.sheetNumber = 1;

    delay1Tick(() => this.subscribeToOrder());
  }

  public highlightErrors(activate: boolean) {
    this.highlightingErrorText = activate;
  }

  public calcDelta(): void {
    const orderPad = this._orderPad;
    const viewSource = this.viewSource;
    if (orderPad === undefined || viewSource === undefined) {
      this._updatedValue = undefined;
      this._deltaValue = undefined;
    } else {
      const limitValue = orderPad.limitValue;
      if (limitValue === undefined) {
        this._updatedValue = undefined;
        this._deltaValue = undefined;
      } else {
        const updValue = limitValue.mul(orderPad.totalQuantity ?? 0);
        this._updatedValue = DecimalFormat.formatMoney(updValue);

        const limitPrice = viewSource.limitPrice;
        if (limitPrice === undefined) {
          this._deltaValue = undefined;
        } else {
          const orgValue = limitPrice.mul(viewSource.quantity);
          const dif = updValue.sub(orgValue);
          this._deltaValue = DecimalFormat.formatMoney(dif);
        }
      }
    }
  }

  dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'AOPDM33090');
  }

  private subscribeToOrder() {
    this._singleOrderCollector.subscribeToOrder(this.primer.accountZenithCode, this.primer.orderId);
  }

  private placeOrder() {
    this._placedStatusBad = false;
    this._placedStatusGood = false;
    this._placedStatus = "Processing...";
    this.checkUnsubscribeFromOrderRequest();

    if (this._orderPad === undefined) {
      throw new AssertInternalError('AOPLPO00123');
    } else {
      const definition = this._orderPad.createOrderRequestDataDefinition();
      this._orderPad.setSent();
      const orderRequestDI = this._unifySvc.adi.subscribe(definition) as OrderRequestDataItem;
      this._orderRequestDI = orderRequestDI;
      this._subidOrderRequestCorrectnessChange = orderRequestDI.subscribeCorrectnessChangedEvent(() => this.handleOrderRequestCorrectnessChangeEvent(orderRequestDI));
      this._subidOrderRequestBadnessChange = orderRequestDI.subscribeBadnessChangedEvent(() => this.handleOrderRequestBadnessChangedEvent(orderRequestDI));
    }
  }

  private handleOrderRequestBadnessChangedEvent(orderRequestDI: OrderRequestDataItem) {
    this._placedStatusBad = true;
    this._placedStatusGood = false;
    this._placedStatus = Badness.Reason.idToDisplay(orderRequestDI.badness.reasonId);
    this._placeOrderRequestActions.push(this._placedStatus);
  }

  private mapErrorDisplay(ore: OrderRequestError): string {
    if (ore.codeId === OrderRequestErrorCodeId.Unknown) return ore.code;
    return OrderRequestErrorCode.idToDisplay(ore.codeId);
  }

  private handleOrderRequestCorrectnessChangeEvent(orderRequestDI: OrderRequestDataItem) {
    if (orderRequestDI.incubated) {
      if (orderRequestDI.error) {
        this._placeOrderRequestActions = [orderRequestDI.errorText];
        this._placedStatusBad = true;
        this._placedStatusGood = false;
        this._placedStatus = "Communications error";
        const errors = orderRequestDI.errors;
        if (errors !== undefined && errors.length > 0) {
          this._placeOrderRequestActions.push(...errors.map(r => this.mapErrorDisplay(r)));
        }
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
        if (orderRequestDI.order) {
          this._placedOrderId = orderRequestDI.order.id;
        }
      }

      this.checkUnsubscribeFromOrderRequest();
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

  private subscribeToSecurity(dataIvemId: DataIvemId) {
    this.checkUnsubscribeFromSecurity();

    const definition = new SecurityDataDefinition(dataIvemId.code, dataIvemId.marketZenithCode);
    this._securityDI = this._unifySvc.adi.subscribe(definition) as SecurityDataItem;
    const viewDataSecurity = new SecurityViewModel(this._bundledSvc, undefined);
    this._viewDataSecurity = viewDataSecurity;
    this.loadViewDataSecurity();
    this._subidSecurityEndChanges = this._securityDI.subscribeEndChangesEvent((DI) => this.loadViewDataSecurity());
    this._subidSecurityFieldValuesChanged = this._securityDI.subscribeFieldValuesChangedEvent((changes) => { viewDataSecurity.loadChanges(changes); });
  }

  private loadViewDataSecurity() {
    if (this._viewDataSecurity === undefined || this._securityDI === undefined) {
      throw new AssertInternalError('AOPLVDS00123');
    } else {
      this._viewDataSecurity.loadFromDI(this._securityDI);
      this.dataAvailableSecurity = this._securityDI.usable;
    }
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
    this._balancesDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountBalancesDataItem;
    this.loadViewDataBalances();

    this._subidBalancesEndChanges = this._balancesDI.subscribeEndChangesEvent(() => { this.loadViewDataBalances(); });
  }

  private loadViewDataBalances(): void {
    if (this._balancesDI === undefined) {
      throw new AssertInternalError('AOPLVDB00123');
    } else {
      this._viewDataBalances = this._balancesDI.records.map(r => BalanceViewModel.newFromDI(r, this._bundledSvc));
      this.dataAvailableBalances = this._balancesDI.usable;
      this.hasBalances = (this._balancesDI.records.length > 0);
    }
  }

  private checkUnsubscribeFromBalances(): void {
    if (this._balancesDI !== undefined) {
      this._balancesDI.unsubscribeEndChangesEvent(this._subidBalancesEndChanges);
      this._unifySvc.adi.unsubscribe(this._balancesDI);
      this._balancesDI = undefined;
    }
  }
}

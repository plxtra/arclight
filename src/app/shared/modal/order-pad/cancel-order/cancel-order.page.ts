import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { AssertInternalError, delay1Tick, MultiEvent } from '@pbkware/js-utils';
import {
  Badness,
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
import { checkmarkDone, chevronForward, close } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { SingleOrderCollector } from 'src/app/shared/collectors/single-order-collector';
import { CancelOrderPlacementTransferModel } from 'src/app/shared/models/transfer/cancel-order-placement.transfermodel';
import { OrderViewModel } from 'src/app/shared/models/view/order.viewmodel';
import { SecurityViewModel } from 'src/app/shared/models/view/security.viewmodel';
import { StandardSecurityControlComponent } from '../../../../components/standard-security-control/standard-security-control.component';

@Component({
  selector: 'app-cancel-order',
  templateUrl: './cancel-order.page.html',
  styleUrls: ['./cancel-order.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StandardSecurityControlComponent,
  ],
})
export class CancelOrderPageComponent implements OnInit, OnDestroy {
  @Input() private primer: CancelOrderPlacementTransferModel;

  public dataAvailableOrder: boolean;
  public dataAvailableSecurity: boolean;
  public sheetNumber: number;

  public readonly anyErrors = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _modalController: ModalController;
  private readonly _singleOrderCollector: SingleOrderCollector;
  private _subSourceOrderChanged: Subscription;

  private _securityDI: SecurityDataItem | undefined;
  private _subidSecurityEndChanges: MultiEvent.SubscriptionId;
  private _subidSecurityFieldValuesChanged: MultiEvent.SubscriptionId;
  private _viewDataSecurity: SecurityViewModel | undefined;

  private _orderPad: OrderPad | undefined;
  private _subidOrderPadChanges: MultiEvent.SubscriptionId;

  private _orderRequestDI: OrderRequestDataItem | undefined;
  private _subidOrderRequestBadnessChange: MultiEvent.SubscriptionId;
  private _subidOrderRequestCorrectnessChange: MultiEvent.SubscriptionId;
  private _placeOrderRequestActions: string[];

  private _viewData: OrderViewModel | undefined;
  private _viewSource: Order | undefined;

  private _placedStatusBad: boolean;
  private _placedStatusGood: boolean;
  private _placedOrderId: string;
  private _placedStatus: string | undefined;

  constructor(
    unifySvc: UnifyService,
    bundledSvc: BundledService,
    modalController: ModalController,
    singleOrderCollector: SingleOrderCollector,
  ) {
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._modalController = modalController;
    this._singleOrderCollector = singleOrderCollector;

    this._subSourceOrderChanged = this._singleOrderCollector.sourceOrderChangeEventEmitter.subscribe(() => {
      window.arclightLogger.logDebug(`Source order changed ${ this._singleOrderCollector.sourceOrder?.id}`);
      const viewSource = this._singleOrderCollector.sourceOrder;
      this._viewSource = viewSource;
      if (viewSource !== undefined) {
        this._viewData = this._singleOrderCollector.orderView;
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
        this._viewSource = undefined;
        this._viewData = undefined;
        this.dataAvailableOrder = false;
      }
    });

    addIcons({
      close,
      checkmarkDone,
      chevronForward,
    });
  }

  public get orderDetails(): OrderViewModel | undefined { return this._viewData; }

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

  public get tradingSymbol(): SecurityViewModel | undefined {
    if (this.dataAvailableSecurity) return this._viewDataSecurity;
    return undefined;
  }

  public get sideColour(): string {
    if (!this._viewSource) return "";

    switch (this._viewSource.sideId) {
      case OrderSideId.Bid:
        return "danger";
      case OrderSideId.Ask:
        return "success";
    }
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
    this.checkUnsubscribeFromSecurity();

    this._placedStatus = undefined;
    this._placeOrderRequestActions = [];

    // defaults
    this.sheetNumber = 1;

    delay1Tick(() => this.subscribeToOrder());
  }

  dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'COPDM33090');
  }

  private subscribeToOrder() {
    this._singleOrderCollector.subscribeToOrder(this.primer.accountZenithCode, this.primer.orderId);
  }

  private placeOrder() {
    this._placedStatusBad = false;
    this._placedStatusGood = false;
    this._placedStatus = "Processing...";
    this.checkUnsubscribeFromOrderRequest();

    const viewSource = this._viewSource;
    if (viewSource === undefined) {
      throw new AssertInternalError('COPPO43091');
    } else {
      this._orderPad = new OrderPad(this._unifySvc.decimalFactory, this._unifySvc.marketsService, this._unifySvc.coreService.symbolDetailCacheService, this._unifySvc.adi);
      this._orderPad.resetModified();
      this._orderPad.loadCancelFromOrder(viewSource);
      this._orderPad.setReadonly();
      const definition = this._orderPad.createOrderRequestDataDefinition();
      this._orderPad.setSent();
      const orderRequestDI = this._unifySvc.adi.subscribe(definition) as OrderRequestDataItem;
      this._orderRequestDI = orderRequestDI;
      this._subidOrderRequestCorrectnessChange = this._orderRequestDI.subscribeCorrectnessChangedEvent(() => this.handleOrderRequestCorrectnessChangeEvent(orderRequestDI));
      this._subidOrderRequestBadnessChange = this._orderRequestDI.subscribeBadnessChangedEvent(() => this.handleOrderRequestBadnessChangedEvent(orderRequestDI));
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
    this._subidSecurityFieldValuesChanged = this._securityDI.subscribeFieldValuesChangedEvent((changes) => viewDataSecurity.loadChanges(changes));
  }

  private loadViewDataSecurity() {
    if (this._viewDataSecurity === undefined || this._securityDI === undefined) {
      throw new AssertInternalError('COPLVDS10123');
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
}

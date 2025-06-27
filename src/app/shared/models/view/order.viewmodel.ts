import { AssertInternalError } from '@pbkware/js-utils';
import { Currency, Order, OrderSide, OrderSideId, OrderType, TimeInForce } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { UnscaledChangeAutoReset } from "src/app/shared/types/unscaled-change-autoreset";
import { zDecimal, zSourceTzOffsetDateTime, zThrottledChangeDetector, znumber, zstring } from "../../types/nullable-types";
import { BaseViewModel } from "./base.viewmodel";

export class OrderViewModel extends BaseViewModel {
  public orderId: zstring;
  public accountZenithCode: zstring;
  public accountIdDisplay: zstring;
  public accountName: zstring;
  public code: zstring;
  public name: zstring;
  public exchange: zstring;
  public environment: zstring;
  public currency: zstring;
  public side: zstring;
  public orderType: zstring;
  public route: zstring;
  public timeInForce: zstring;

  public status: zstring;
  public canAmend= false;
  public canCancel = false;

  private _expiryDate: zSourceTzOffsetDateTime;
  private _expiryDateDisplay: string;
  private _tradedPrice: zDecimal;
  private _placedQuantity: znumber;
  private _placedPrice: zDecimal;
  private _placedPriceDisplay: string;
  private _placedQuantityDisplay: string;
  private _tradedPriceDisplay: string;
  private _tradedQuantity: znumber;
  private _tradedQuantityDisplay: string;
  private _created: zSourceTzOffsetDateTime;
  private _createdDisplay: string | undefined;
  private _updated: zSourceTzOffsetDateTime;
  private _updatedDisplay: string | undefined;
  private _untradedQuantity: znumber;
  private _untradedQuantityDisplay: string;
  private _sideId: OrderSideId;

  // changes
  private _recordAutoReset: UnscaledChangeAutoReset;
  private _tradedQuantityAutoReset: UnscaledChangeAutoReset;
  private _tradedPriceAutoReset: UnscaledChangeAutoReset;
  private _untradedQuantityAutoReset: UnscaledChangeAutoReset;
  private _updatedAutoReset: UnscaledChangeAutoReset;
  private _statusAutoReset: UnscaledChangeAutoReset;

  constructor(bundledSvc: BundledService, tcd: zThrottledChangeDetector) {
    super(bundledSvc);
    const changeInterval = bundledSvc.personalisationService.highlightTime;
    this._recordAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._tradedPriceAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._tradedQuantityAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._untradedQuantityAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._updatedAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._statusAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
  }

  public get recordChanged(): boolean { return this._recordAutoReset.Changed; }
  public get tradedQuantityChanged(): boolean { return this._tradedQuantityAutoReset.Changed; }
  public get tradedPriceChanged(): boolean { return this._tradedPriceAutoReset.Changed; }
  public get untradedQuantityChanged(): boolean { return this._untradedQuantityAutoReset.Changed; }
  public get updatedChanged(): boolean { return this._updatedAutoReset.Changed; }
  public get statusChanged(): boolean { return this._statusAutoReset.Changed; }

  public get expiryDate(): zSourceTzOffsetDateTime {
    return this._expiryDate;
  }
  public set expiryDate(v: zSourceTzOffsetDateTime) {
    if (this._expiryDate !== v) {
      this._expiryDate = v;
      this._expiryDateDisplay = this.fromatDateTZ(this.expiryDate, "Never");
    }
  }
  public get expiryDateDisplay(): string {
    return this._expiryDateDisplay;
  }

  public get placedPrice(): zDecimal {
    return this._placedPrice;
  }
  public set placedPrice(v: zDecimal) {
    if (this._placedPrice !== v) {
      this._placedPrice = v;
      this._placedPriceDisplay = this.formatPrice(this.placedPrice, "Mkt");
    }
  }
  public get placedPriceDisplay(): string {
    return this._placedPriceDisplay;
  }

  public get placedQuantity(): znumber {
    return this._placedQuantity;
  }
  public set placedQuantity(v: znumber) {
    if (this._placedQuantity !== v) {
      this._placedQuantity = v;
      this._placedQuantityDisplay = this.formatNumber(this.placedQuantity);
    }
  }
  public get placedQuantityDisplay(): string {
    return this._placedQuantityDisplay;
  }

  public get tradedPrice(): zDecimal {
    return this._tradedPrice;
  }
  public set tradedPrice(v: zDecimal) {
    if (this._tradedPrice !== v) {
      this._tradedPrice = v;
      this._tradedPriceDisplay = this.formatPrice(this.tradedPrice, "-.--");
    }
  }
  public get tradedPriceDisplay(): string {
    return this._tradedPriceDisplay;
  }

  public get tradedQuantity(): znumber {
    return this._tradedQuantity;
  }
  public set tradedQuantity(v: znumber) {
    if (this._tradedQuantity !== v) {
      this._tradedQuantity = v;
      this._tradedQuantityDisplay = this.formatNumber(this.tradedQuantity, "-");
    }
  }
  public get tradedQuantityDisplay(): string {
    return this._tradedQuantityDisplay;
  }

  public get created(): zSourceTzOffsetDateTime {
    return this._created;
  }
  public set created(v: zSourceTzOffsetDateTime) {
    if (this._created !== v) {
      this._created = v;
      this._createdDisplay = this.fromatDateTimeTZ(this.created);
    }
  }
  public get createdDisplay(): string | undefined {
    return this._createdDisplay;
  }

  public get updated(): zSourceTzOffsetDateTime {
    return this._updated;
  }
  public set updated(v: zSourceTzOffsetDateTime) {
    if (this._updated !== v) {
      this._updated = v;
      this._updatedDisplay = this.fromatDateTimeTZ(this.updated);
    }
  }
  public get updatedDisplay(): string | undefined {
    return this._updatedDisplay;
  }

  public get untradedQuantity(): znumber {
    return this._untradedQuantity;
  }
  public set untradedQuantity(v: znumber) {
    if (this._untradedQuantity !== v) {
      if (this._untradedQuantity) this._untradedQuantityAutoReset.markAsChanged();
      this._untradedQuantity = v;
      this._untradedQuantityDisplay = this.formatNumber(this.untradedQuantity);
    }
  }
  public get untradedQuantityDisplay(): string {
    return this._untradedQuantityDisplay;
  }

  public get sideId(): OrderSideId {
    return this._sideId;
  }

  public get isBidOrder(): boolean {
    return this._sideId === OrderSideId.Bid;
  }

  public get isAskOrder(): boolean {
    return this._sideId === OrderSideId.Ask;
  }

  static newFromDI(odr: Order, bundledSvc: BundledService, tcd: zThrottledChangeDetector): OrderViewModel {
    const model = new OrderViewModel(bundledSvc, tcd);
    model.loadFromDI(odr);
    model.loadChangeNewRecord();
    return model;
  }

  loadFromDI(odr: Order): void {
    // async lookups
    this.getSymbolName(odr.ivemId).then(
      (name) => { this.name = name },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'OVMLODI20200'); }
    );

    this.orderId = odr.id;
    this.accountZenithCode = odr.account.zenithCode;
    this.accountIdDisplay = odr.account.id.display;
    this.accountName = this.bundledService.brokerageAccountsService.findAccount(odr.account.zenithCode)?.name;
    this.code = this.getIvemIdDisplay(odr.ivemId);
    this.exchange = odr.exchange.abbreviatedDisplay;
    this.environment = odr.exchange.exchangeEnvironment.display;
    this.currency = (odr.currencyId === undefined)
      ? ""
      : Currency.idToDisplay(odr.currencyId);
    this.placedQuantity = odr.quantity;
    this.placedPrice = odr.limitPrice;
    this.tradedQuantity = odr.executedQuantity
    this.tradedPrice = odr.averagePrice;
    this.untradedQuantity = odr.quantity - (odr.executedQuantity);
    this._sideId = odr.sideId;
    this.side = OrderSide.idToDisplay(odr.sideId);
    this.orderType = OrderType.idToDisplay(odr.equityOrderTypeId);
    this.timeInForce = TimeInForce.idToDisplay(odr.timeInForceId);
    const routeMarket = odr.routeMarket;
    this.route = routeMarket === undefined ? '?' : routeMarket.display;
    this.expiryDate = odr.expiryDate;
    this.status = odr.status;
    this.created = odr.createdDate;
    this.updated = odr.updatedDate;
    this.canAmend = odr.canAmend();
    this.canCancel = odr.canCancel();
  }

  loadChanges(valueChanges: Order.ValueChange[]): void {
    valueChanges.forEach(chg => {
      switch (chg.fieldId) {
        case Order.FieldId.ExecutedQuantity:
          this._tradedQuantityAutoReset.markAsChanged();
          break;
        case Order.FieldId.AveragePrice:
          this._tradedPriceAutoReset.markAsChanged();
          break;
        case Order.FieldId.UpdatedDate:
          this._updatedAutoReset.markAsChanged();
          break;
        case Order.FieldId.Status:
          this._statusAutoReset.markAsChanged();
          break;
      }
    });
  }

  loadChangeNewRecord() {
    this._recordAutoReset.markAsChanged();
  }
}

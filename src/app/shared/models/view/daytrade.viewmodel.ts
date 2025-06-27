import { DayTradesDataItem, Movement, MovementId, TradeFlag } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { zDecimal, zInteger, zSourceTzOffsetDateTime, zstring } from "../../types/nullable-types";
import { ThrottledChangeDetector } from "../../types/throttled-change-detector";
import { UnscaledChangeAutoReset } from "../../types/unscaled-change-autoreset";
import { BaseViewModel } from "./base.viewmodel";

export interface DayTradesViewData {
  // id: zInteger;
  // price: zDecimal;
  // quantity: zInteger;
  // when: zSourceTzOffsetDateTime;
  // flags: zstring;
  // trend: zstring;
  priceDisplay: string;
  recordChanged: boolean;
  quantityDisplay: string;
  whenDisplay: string;
  idDisplay: string;
}

export class DayTradesViewModel extends BaseViewModel implements DayTradesViewData {
  public id: zInteger;

  private _price: zDecimal;
  private _quantity: zInteger;
  private _when: zSourceTzOffsetDateTime;
  private _flags: zstring;
  private _trend: zstring;
  private _conditionCodes: zstring;
  private _attributes: zstring;

  // changes
  private _recordAutoReset: UnscaledChangeAutoReset;
  // private _priceAutoReset: UnscaledChangeAutoReset;
  // private _quantityAutoReset: UnscaledChangeAutoReset;
  // private _whenAutoReset: UnscaledChangeAutoReset;
  // private _flagsAutoReset: UnscaledChangeAutoReset;
  // private _trendAutoReset: UnscaledChangeAutoReset;
  // private _conditionCodesAutoReset: UnscaledChangeAutoReset;
  // private _attributesAutoReset: UnscaledChangeAutoReset;

  constructor(bundledSvc: BundledService, tcd: ThrottledChangeDetector) {
    super(bundledSvc);
    const changeInterval = bundledSvc.personalisationService.highlightTime;
    this._recordAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._priceAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._quantityAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._whenAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._flagsAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._trendAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._conditionCodesAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    // this._attributesAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
  }

  public get price(): zDecimal {
    return this._price;
  }
  public set price(v: zDecimal) {
    if (this._price !== v) {
      // if (this._price) this._priceAutoReset.markAsChanged();
      this._price = v;
    }
  }

  public get quantity(): zInteger {
    return this._quantity;
  }
  public set quantity(v: zInteger) {
    if (this._quantity !== v) {
      // if (this._quantity) this._quantityAutoReset.markAsChanged();
      this._quantity = v;
    }
  }

  public get when(): zSourceTzOffsetDateTime {
    return this._when;
  }
  public set when(v: zSourceTzOffsetDateTime) {
    if (this._when !== v) {
      // if (this._when) this._whenAutoReset.markAsChanged();
      this._when = v;
    }
  }

  public get flags(): zstring {
    return this._flags;
  }
  public set flags(v: zstring) {
    if (this._flags !== v) {
      // if (this._flags) this._flagsAutoReset.markAsChanged();
      this._flags = v;
    }
  }

  public get trend(): zstring {
    return this._trend;
  }
  public set trend(v: zstring) {
    if (this._trend !== v) {
      // if (this._trend) this._trendAutoReset.markAsChanged();
      this._trend = v;
    }
  }

  public get conditionCodes(): zstring {
    return this._conditionCodes;
  }
  public set conditionCodes(v: zstring) {
    if (this._conditionCodes !== v) {
      // if (this._conditionCodes) this._conditionCodesAutoReset.markAsChanged();
      this._conditionCodes = v;
    }
  }

  public get attributes(): zstring {
    return this._attributes;
  }
  public set attributes(v: zstring) {
    if (this._attributes !== v) {
      // if (this._attributes) this._attributesAutoReset.markAsChanged();
      this._attributes = v;
    }
  }

  public get idDisplay(): string { return this.formatInteger(this.id); }
  public get priceDisplay(): string { return this.formatPrice(this.price); }
  public get quantityDisplay(): string { return this.formatInteger(this.quantity); }
  public get whenDisplay(): string { return this.fromatTimeTZ(this.when); }

  public get recordChanged(): boolean { return this._recordAutoReset.Changed; }
  // public get priceChanged(): boolean { return this._priceAutoReset.Changed; }
  // public get quantityChanged(): boolean { return this._quantityAutoReset.Changed; }
  // public get whenChanged(): boolean { return this._whenAutoReset.Changed; }
  // public get flagsChanged(): boolean { return this._flagsAutoReset.Changed; }
  // public get trendChanged(): boolean { return this._trendAutoReset.Changed; }
  // public get conditionCodesChanged(): boolean { return this._conditionCodesAutoReset.Changed; }
  // public get attributesChanged(): boolean { return this._attributesAutoReset.Changed; }

  static newFromRecord(trade: DayTradesDataItem.Record, bundledSvc: BundledService, tcd: ThrottledChangeDetector): DayTradesViewModel {
    const model = new DayTradesViewModel(bundledSvc, tcd);
    model.loadFromRecord(trade);
    model.loadChangeNewRecord();
    return model;
  }

  static reverseIdCompare(a: DayTradesViewModel | undefined, b: DayTradesViewModel | undefined): number {
    if (!a || !b) return 0;
    if ((a.id ?? 0) > (b.id ?? 0)) return -1; // a after b
    else if ((a.id ?? 0) < (b.id ?? 0)) return 1; // a before b
    else return 0; // no change
  }

  loadFromRecord(trade: DayTradesDataItem.Record | undefined): void {
    if (trade) {
      this.id = trade.tradeRecord.id;
      this.price = trade.tradeRecord.price;
      this.quantity = trade.tradeRecord.quantity;
      this.when = trade.tradeRecord.time;
      this.flags = trade.tradeRecord.flagIds.map(f => TradeFlag.idToDisplay(f)).reduce((pre, cur) => pre.concat(" ").concat(cur), "").trim();
      this.trend = Movement.idToDisplay(trade.tradeRecord.trendId ?? MovementId.None);
      this.conditionCodes = trade.tradeRecord.conditionCodes;
      this.attributes = trade.tradeRecord.attributes.reduce((pre, cur) => pre.concat(" ").concat(cur), "").trim();
    }
  }

  loadChangeNewRecord() {
    this._recordAutoReset.markAsChanged();
  }
}

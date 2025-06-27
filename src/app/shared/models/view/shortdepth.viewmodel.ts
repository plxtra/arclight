import { PriceOrRemainder, ShortDepthRecord } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { znumber } from "../../types/nullable-types";
import { ThrottledChangeDetector } from "../../types/throttled-change-detector";
import { UnscaledChangeAutoReset } from "../../types/unscaled-change-autoreset";
import { BaseViewModel } from "./base.viewmodel";

export interface ShortDepthViewData {
  priceChanged: boolean | undefined;
  index: znumber;
  recordChanged: boolean | undefined;
  willPartiallyMatch: boolean | undefined;
  priceDisplay: string | undefined;
  countDisplay: string | undefined;
  volumeDisplay: string | undefined;
  volumeChanged: boolean | undefined;
  countChanged: boolean | undefined;
}

export class ShortDepthViewModel extends BaseViewModel implements ShortDepthViewData {
  public index: znumber;

  private _price: PriceOrRemainder;
  private _count: znumber;
  private _volume: znumber;
  private _willPartiallyMatch = false;

  // changes
  private _recordAutoReset: UnscaledChangeAutoReset;
  private _priceAutoReset: UnscaledChangeAutoReset;
  private _countAutoReset: UnscaledChangeAutoReset;
  private _volumeAutoReset: UnscaledChangeAutoReset;
  private _willPartiallyMatchAutoReset: UnscaledChangeAutoReset;

  constructor(bundledSvc: BundledService, tcd: ThrottledChangeDetector) {
    super(bundledSvc);
    const changeInterval = bundledSvc.personalisationService.highlightTime;
    this._recordAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._priceAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._countAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._volumeAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._willPartiallyMatchAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
  }

  public get price(): PriceOrRemainder {
    return this._price;
  }
  public set price(v: PriceOrRemainder) {
    if (this._price !== v) {
      if (this._price) this._priceAutoReset.markAsChanged();
      this._price = v;
    }
  }

  public get count(): znumber {
    return this._count;
  }
  public set count(v: znumber) {
    if (this._count !== v) {
      if (this._count) this._countAutoReset.markAsChanged();
      this._count = v;
    }
  }

  public get volume(): znumber {
    return this._volume;
  }
  public set volume(v: znumber) {
    if (this._volume !== v) {
      if (this._volume) this._volumeAutoReset.markAsChanged();
      this._volume = v;
    }
  }

  public get willPartiallyMatch(): boolean {
    return this._willPartiallyMatch;
  }
  public set willPartiallyMatch(v: boolean) {
    if (this._willPartiallyMatch !== v) {
      if (this._willPartiallyMatch) this._willPartiallyMatchAutoReset.markAsChanged();
      this._willPartiallyMatch = v;
    }
    this._willPartiallyMatch = v;
  }

  public get priceDisplay(): string { return this._price === null ? '' : this.formatPrice(this._price); }
  public get countDisplay(): string { return this.formatNumber(this.count); }
  public get volumeDisplay(): string { return this.formatNumber(this.volume); }

  public get recordChanged(): boolean { return this._recordAutoReset.Changed; }
  public get priceChanged(): boolean { return this._priceAutoReset.Changed; }
  public get countChanged(): boolean { return this._countAutoReset.Changed; }
  public get volumeChanged(): boolean { return this._volumeAutoReset.Changed; }
  public get willPartiallyMatchChanged(): boolean { return this._willPartiallyMatchAutoReset.Changed; }

  loadFromRecord(depth: ShortDepthRecord, idx: number): void {
    this.index = idx;

    this.price = depth.price;
    this.count = depth.orderCount;
    this.volume = depth.getVolume();
    this.willPartiallyMatch = depth.inAuction;
  }

  loadChangeNewRecord() {
    this._recordAutoReset.markAsChanged();
  }
}

export namespace ShortDepthViewModel {
  export function newFromRecord(depth: ShortDepthRecord, idx: number, bundledSvc: BundledService, tcd: ThrottledChangeDetector): ShortDepthViewModel {
    const model = new ShortDepthViewModel(bundledSvc, tcd);
    model.loadFromRecord(depth, idx);
    model.loadChangeNewRecord();
    return model;
  }
}

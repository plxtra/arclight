import { DayTradesDataItem, DayTradesGridRecordStore } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { DayTradesViewData, DayTradesViewModel } from "../models/view/daytrade.viewmodel";
import { ThrottledChangeDetector } from "../types/throttled-change-detector";
import { BaseHousing } from "./base-housing";

export class TradesHousing extends BaseHousing {
  public viewDataForDay: DayTradesViewModel[];
  public viewDataRecent: DayTradesViewData[];

  private readonly _recordStore: DayTradesGridRecordStore;
  private readonly _bundledSvc: BundledService;

  constructor(
    recordStore: DayTradesGridRecordStore,
    tcd: ThrottledChangeDetector,
    bundledSvc: BundledService
  ) {
    super(tcd);
    this._recordStore = recordStore;
    this._bundledSvc = bundledSvc;

    this.viewDataForDay = [];
  }

  public assignDataItem(di: DayTradesDataItem) {
    this._recordStore.setDataItem(di);
  }

  // Too much work to do here and difficult to monitor changes. Try to maintain list better.
  // override endChange(): void {
  //     this.viewData = this._ds.getRecords().map(r => TradesViewModel.newFromRecord(r.tradeRecord)).sort(TradesViewModel.reverseIdCompare);

  //     super.endChange();
  // }

  override allRecordsDeleted(): void {
    this.viewDataForDay = [];
    this.generateRecent();

    super.allRecordsDeleted();
  }

  override recordsLoaded(recent?: boolean): void {
    // newest first
    this.viewDataForDay = this._recordStore.getRecords().map(r => DayTradesViewModel.newFromRecord(r, this._bundledSvc, this._tcd)).reverse();
    this.generateRecent();

    super.recordsLoaded(recent);
  }

  override recordInserted(recordIndex: number, recent?: boolean): void {
    const srcRec = this._recordStore.getRecord(recordIndex);
    const newRec = DayTradesViewModel.newFromRecord(srcRec, this._bundledSvc, this._tcd)
    this.viewDataForDay.splice(this.viewIndex(recordIndex), 0, newRec);
    this.generateRecent();

    this.cloneForMutability();
    super.recordInserted(recordIndex, recent);
  }

  override recordsInserted(firstInsertedRecordIndex: number, count: number, recent?: boolean): void {
    const srcRecs = this._recordStore.getRecords().slice(firstInsertedRecordIndex, firstInsertedRecordIndex + count);
    const newRecs = srcRecs.map((r) => DayTradesViewModel.newFromRecord(r, this._bundledSvc, this._tcd)).reverse();
    const insertIdx = this.viewIndex(firstInsertedRecordIndex);
    this.viewDataForDay.splice(insertIdx, 0, ...newRecs);
    this.generateRecent();

    this.cloneForMutability();
    super.recordsInserted(firstInsertedRecordIndex, count, recent);
  }

  override invalidateRecord(recordIndex: number, recent?: boolean): void {
    const srcRec = this._recordStore.getRecord(recordIndex);
    this.viewDataForDay[this.viewIndex(recordIndex)].loadFromRecord(srcRec);
    this.generateRecent();

    this.cloneForMutability();
    super.invalidateRecord(recordIndex, recent);
  }

  override invalidateRecords(recordIndex: number, count: number, recent?: boolean): void {
    for (let loop = 0; loop < count; loop++) {
      const idx = recordIndex + loop;
      const srcRec = this._recordStore.getRecord(idx);
      this.viewDataForDay[this.viewIndex(idx)].loadFromRecord(srcRec);
    }
    this.generateRecent();

    this.cloneForMutability();
    super.invalidateRecords(recordIndex, count, recent);
  }

  private viewIndex(recordIndex: number): number {
    // reverse order
    return this.viewDataForDay.length - recordIndex;
  }

  private generateRecent(): void {
    this.viewDataRecent = this.viewDataForDay.slice(0, 1000);
  }

  private cloneForMutability() {
    this.viewDataForDay = [...this.viewDataForDay]; // clone it to trigger view update in cdkViewPort
  }
}

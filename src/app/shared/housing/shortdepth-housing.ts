import { DepthStyleId, ShortDepthSideGridRecordStore } from "@plxtra/motif-core";
import { RevRecordInvalidatedValue } from "revgrid";
import { BundledService } from "src/app/services/bundled.service";
import { ShortDepthViewData, ShortDepthViewModel } from "../models/view/shortdepth.viewmodel";
import { ThrottledChangeDetector } from "../types/throttled-change-detector";
import { BaseHousing } from "./base-housing";

export class ShortDepthHousing extends BaseHousing {
  public viewDatas: ShortDepthViewData[];
  private _viewModels: ShortDepthViewModel[];

  private readonly _ds: ShortDepthSideGridRecordStore;
  private readonly _bundledSvc: BundledService;

  constructor(
    ds: ShortDepthSideGridRecordStore,
    tcd: ThrottledChangeDetector,
    bundledSvc: BundledService
  ) {
    super(tcd);
    this._ds = ds;
    this._bundledSvc = bundledSvc;
    this.setViewModels([]);
  }

  // Too much work to do here and difficult to monitor changes. Try to maintain list better.
  // override endChange(): void {
  //     if (this._ds.styleId === DepthStyleId.Full) {
  //         this.viewData = this._ds.getRecords().map((r, idx) => FullDepthViewModelImplementation.newFromRecord(r, idx, this._personalisationSvc.highlightTime));
  //     }

  //     super.endChange();
  // }

  override recordsLoaded(recent?: boolean): void {
    if (this._ds.styleId === DepthStyleId.Short) {
      const viewModels = this._ds.getRecords().map((r, idx) => ShortDepthViewModel.newFromRecord(r, idx, this._bundledSvc, this._tcd));
      this.setViewModels(viewModels);
    }

    super.recordsLoaded(recent);
  }

  override recordInserted(recordIndex: number, recent?: boolean): void {
    const srcRec = this._ds.getRecord(recordIndex);
    const newRec = ShortDepthViewModel.newFromRecord(srcRec, recordIndex, this._bundledSvc, this._tcd)
    this._viewModels.splice(recordIndex, 0, newRec);

    super.recordInserted(recordIndex, recent);
  }

  override recordsInserted(firstInsertedRecordIndex: number, count: number, recent?: boolean): void {
    const srcRecs = this._ds.getRecords().slice(firstInsertedRecordIndex, firstInsertedRecordIndex + count);
    const newRecs = srcRecs.map((r, idx) => ShortDepthViewModel.newFromRecord(r, idx, this._bundledSvc, this._tcd));
    this._viewModels.splice(firstInsertedRecordIndex, 0, ...newRecs);

    super.recordsInserted(firstInsertedRecordIndex, count, recent);
  }

  override recordDeleted(recordIndex: number): void {
    this._viewModels.splice(recordIndex, 1);

    super.recordDeleted(recordIndex);
  }

  override recordsDeleted(recordIndex: number, count: number): void {
    this._viewModels.splice(recordIndex, count);
  }

  override recordsSpliced(recordIndex: number, deleteCount: number, insertCount: number): void {
    const srcRecs = this._ds.getRecords().slice(recordIndex, recordIndex + insertCount);
    const newRecs = srcRecs.map((r, idx) => ShortDepthViewModel.newFromRecord(r, idx, this._bundledSvc, this._tcd));
    this._viewModels.splice(recordIndex, deleteCount, ...newRecs);

    super.recordsSpliced(recordIndex, deleteCount, insertCount);
  }

  override invalidateRecord(recordIndex: number, recent?: boolean): void {
    const srcRec = this._ds.getRecord(recordIndex);
    this._viewModels[recordIndex].loadFromRecord(srcRec, recordIndex);

    super.invalidateRecord(recordIndex, recent);
  }

  override invalidateRecords(recordIndex: number, count: number, recent?: boolean): void {
    for (let loop = 0; loop < count; loop++) {
      const idx = recordIndex + loop;
      const srcRec = this._ds.getRecord(idx);
      this._viewModels[idx].loadFromRecord(srcRec, idx);
    }

    super.invalidateRecords(recordIndex, count, recent);
  }

  override invalidateRecordAndValues(recordIndex: number, invalidatedValues: RevRecordInvalidatedValue[], recordUpdateRecent?: boolean): void {
    const srcRec = this._ds.getRecord(recordIndex);
    this._viewModels[recordIndex].loadFromRecord(srcRec, recordIndex);

    super.invalidateRecordAndValues(recordIndex, invalidatedValues, recordUpdateRecent);
  }

  override recordMoved(oldRecordIndex: number, newRecordIndex: number): void {
    const rec = this._viewModels[oldRecordIndex];
    this._viewModels.splice(oldRecordIndex, 1);
    this._viewModels.splice(newRecordIndex, 0, rec);

    super.recordMoved(oldRecordIndex, newRecordIndex);
  }

  override recordReplaced(recordIndex: number): void {
    const srcRec = this._ds.getRecord(recordIndex);
    this._viewModels[recordIndex].loadFromRecord(srcRec, recordIndex);

    super.recordReplaced(recordIndex);
  }

  override recordsReplaced(recordIndex: number, count: number): void {
    for (let loop = 0; loop < count; loop++) {
      const idx = recordIndex + loop;
      const srcRec = this._ds.getRecord(idx);
      this._viewModels[idx].loadFromRecord(srcRec, idx);
    }

    super.recordsReplaced(recordIndex, count);
  }

  private setViewModels(viewModels: ShortDepthViewModel[]) {
    this._viewModels = viewModels;
    this.viewDatas = viewModels;
  }
}

import { RevRecordFieldIndex, RevRecordIndex, RevRecordInvalidatedValue, RevRecordStore, RevRecordValueRecentChangeTypeId } from 'revgrid';
import { ThrottledChangeDetector } from '../types/throttled-change-detector';

export class BaseHousing implements RevRecordStore.RecordsEventers {
  constructor(
    protected readonly _tcd: ThrottledChangeDetector
  ) {
    // Intentionally left empty
  }

  public beginChange(): void { this._tcd.detectChanges(); }
  public endChange(): void { this._tcd.detectChanges(); }
  public allRecordsDeleted(): void { this._tcd.detectChanges(); }
  public recordDeleted(recordIndex: RevRecordIndex): void { this._tcd.detectChanges(); }
  public recordsDeleted(recordIndex: RevRecordIndex, count: number): void { this._tcd.detectChanges(); }
  public recordInserted(recordIndex: RevRecordIndex, recent?: boolean): void { this._tcd.detectChanges(); }
  public recordsInserted(firstInsertedRecordIndex: RevRecordIndex, count: number, recent?: boolean): void { this._tcd.detectChanges(); }
  public recordsSpliced(recordIndex: RevRecordIndex, deleteCount: number, insertCount: number): void { this._tcd.detectChanges(); }
  public recordsLoaded(recent?: boolean): void { this._tcd.detectChanges(); }
  public invalidateAll(): void { this._tcd.detectChanges(); }
  public invalidateRecord(recordIndex: RevRecordIndex, recent?: boolean): void { this._tcd.detectChanges(); }
  public invalidateRecords(recordIndex: RevRecordIndex, count: number, recent?: boolean): void { this._tcd.detectChanges(); }
  public invalidateValue(fieldIndex: RevRecordFieldIndex, recordIndex: RevRecordIndex, valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId): void { this._tcd.detectChanges(); }
  public invalidateRecordValues(recordIndex: RevRecordIndex, invalidatedValues: RevRecordInvalidatedValue[]): void { this._tcd.detectChanges(); }
  public invalidateRecordFields(recordIndex: RevRecordIndex, fieldIndex: RevRecordFieldIndex, fieldCount: number): void { this._tcd.detectChanges(); }
  public invalidateRecordAndValues(recordIndex: RevRecordIndex, invalidatedValues: RevRecordInvalidatedValue[], recordUpdateRecent?: boolean): void { this._tcd.detectChanges(); }
  public invalidateFiltering(): void { this._tcd.detectChanges(); }
  public invalidateFields(fieldIndexes: RevRecordFieldIndex[]): void { this._tcd.detectChanges(); }
  public recordMoved(oldRecordIndex: RevRecordIndex, newRecordIndex: RevRecordIndex): void { this._tcd.detectChanges(); }
  public recordReplaced(recordIndex: RevRecordIndex): void { this._tcd.detectChanges(); }
  public recordsReplaced(recordIndex: RevRecordIndex, count: number): void { this._tcd.detectChanges(); }
  public recordsMoved(oldRecordIndex: RevRecordIndex, newRecordIndex: RevRecordIndex): void { this._tcd.detectChanges(); }
}

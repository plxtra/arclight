import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { zThrottledChangeDetector } from "./nullable-types";
import { RecentMovement } from "./shared-types";

export class ScaledChangeAutoReset {
  private _changed: RecentMovement;
  private _subject: Subject<RecentMovement>;
  private _tcd: zThrottledChangeDetector;

  constructor(tcd: zThrottledChangeDetector, msDelayToReset: number) {
    this._subject = new Subject<RecentMovement>();
    this._tcd = tcd;
    this._subject.pipe(debounceTime(msDelayToReset)).subscribe({
      next: () => {
        this._changed = RecentMovement.UNCHANGED;
        if (this._tcd !== undefined)
          this._tcd.detectChanges();
      }
    });
  }

  public get changed(): RecentMovement {
    return this._changed;
  }

  public markAsChanged(scaled: RecentMovement) {
    this._changed = scaled;
    if (this._tcd !== undefined)
      this._tcd.detectChanges();
    this._subject.next(scaled);
  }
}

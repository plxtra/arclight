import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { zThrottledChangeDetector } from "./nullable-types";
import { RecentMovement } from "./shared-types";

export class UnscaledChangeAutoReset {
  private _changed: RecentMovement;
  private _subject: Subject<RecentMovement>;
  private _tcd: zThrottledChangeDetector;

  constructor(tcd: zThrottledChangeDetector, msDelayToReset: number) {
    this._subject = new Subject<RecentMovement>();
    this._tcd = tcd;
    this._subject.pipe(debounceTime(msDelayToReset)).subscribe({
      next: () => { this.resetChanged(); }
    })
  }

  public get Changed(): boolean {
    return (this._changed === RecentMovement.UPDATE);
  }

  public markAsChanged() {
    this._changed = RecentMovement.UPDATE;
    if (this._tcd !== undefined)
      this._tcd.detectChanges();
    this._subject.next(RecentMovement.UPDATE);
  }

  private resetChanged() {
    this._changed = RecentMovement.UNCHANGED;
    if (this._tcd !== undefined)
      this._tcd.detectChanges();
  }
}


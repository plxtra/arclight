import { ChangeDetectorRef } from "@angular/core";
import { Subject } from "rxjs";
import { bufferTime } from "rxjs/operators";

export class ThrottledChangeDetector {
  private readonly _cdr: ChangeDetectorRef;
  private readonly _throttle: Subject<number>;

  private readonly _msThrottleTime: number = 50;

  constructor(cdr: ChangeDetectorRef) {
    this._cdr = cdr;

    this._throttle = new Subject<number>();
    this._throttle.pipe(bufferTime(this._msThrottleTime)).subscribe({
      next: (args) => {
        if (args.length > 0) {
          this._cdr.detectChanges();
        }
      }
    });
  }

  public get changeDetector(): ChangeDetectorRef {
    return this._cdr;
  }

  public detectChanges() {
    this._throttle.next(Date.now());
  }
}

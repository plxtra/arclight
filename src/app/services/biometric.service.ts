import { Injectable, inject } from "@angular/core";
import { filter, map, pairwise, timeInterval } from "rxjs/operators";
import { DisplayStateService } from "./display-state.service";

@Injectable({
  providedIn: "root"
})
export class BiometricService {
  private readonly _displayStateService: DisplayStateService;
  private readonly lockAfterSec: number = 60;

  constructor() {
    const displayStateSvc = inject(DisplayStateService);

    this._displayStateService = displayStateSvc;

    this._displayStateService.MobileFocusStream
      .pipe(
        timeInterval(),
        pairwise(),
        filter(([first, second]) => !first.value && second.value),
        map(([, second]) => second.interval)
      ).subscribe((tm) => {
        if (tm > this.lockAfterSec * 1000) {
          window.arclightLogger.logDebug('BIO: show lock');
        }
      });
  }
}

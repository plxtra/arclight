import { Injectable } from "@angular/core";

import { Observable, timer } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class ClockService {
  private _utcTime$: Observable<Date>;

  constructor() {
    this._utcTime$ = timer(0, 1000).pipe(
      map(tick => new Date(new Date().getTime())),
      shareReplay(1)
    );
  }

  get utcTime() {
    return this._utcTime$;
  }
}
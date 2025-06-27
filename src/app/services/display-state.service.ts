import { Injectable } from "@angular/core";
import MobileDetect from "mobile-detect";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class DisplayStateService {
  public readonly MobileFocusStream: Subject<boolean>;

  private _mobileDetect: MobileDetect;

  private _isMobileDevice: string | null;
  private _standalone: string;
  private _displayState: string;

  constructor() {
    this.MobileFocusStream = new Subject<boolean>();

    this._mobileDetect = new MobileDetect(window.navigator.userAgent);
    this._isMobileDevice = this._mobileDetect.mobile();

    this._standalone = "";
    // if ((navigator as any).standalone) {
    if (('standalone' in window.navigator) && (window.navigator['standalone'])) {
      this._standalone = "standalone-ios";
    }
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this._standalone = "standalone";
    }

    this._displayState = this.getState();
    this.MobileFocusStream.next(true);

    //subscribe to all of the events related to visibility
    ['pageshow', 'focus', 'blur', 'visibilitychange', 'resume'].forEach((type) => {
      window.addEventListener(type, this.onDisplayStateChange, { capture: true });
    });
  }

  public get isMobileDevice(): string | null {
    return this._isMobileDevice;
  }

  public get standalone(): string {
    return this._standalone;
  }

  public get displayState() {
    return this._displayState;
  }

  private getState(): string {
    if (document.visibilityState === "hidden") {
      return "hidden";
    }
    if (document.hasFocus()) {
      return "active";
    }
    return "passive";
  }

  private onDisplayStateChange = () => {
    const nextState = this.getState();
    const prevState = this.displayState;

    if (nextState !== prevState) {
      window.arclightLogger.logDebug(`DISPLAY: state changed: ${prevState} >>> ${nextState}`);
      this._displayState = nextState;

      //standalone will restrict to only run  ning for an installed PWA on mobile
      if (this.isMobileDevice) {
        if (nextState === 'active' /* && standalone */) {
          //The app/browser tab has just been made active and is visible to the user
          //do whatever you want in here to update dynamic content, call api etc
          window.arclightLogger.logDebug('DISPLAY: Brought to foreground');
          this.MobileFocusStream.next(true);
        } else if (prevState === 'active' && nextState !== 'active') {
          window.arclightLogger.logDebug('DISPLAY: No longer foreground');
          this.MobileFocusStream.next(false);
        }
      }
    }
  };
}

// Thanks: https://stackoverflow.com/a/64979288/18147343

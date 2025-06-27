import { Directive } from '@angular/core';
import { SignalDispatcher } from 'strongly-typed-events';

@Directive()
export abstract class DataLoadingTemplateDirective {

  protected _initialised = false;
  private _onInitialised = new SignalDispatcher();

  public get initialised(): boolean {
    return this._initialised;
  }

  public get onInitialised() {
    return this._onInitialised.asEvent();
  }

  protected initialisationDone(target?: string) {
    if (!this._initialised) {
      this._initialised = true;
      this._onInitialised.dispatch();
    }
  }
}

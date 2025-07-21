import { Injectable, inject } from "@angular/core";
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { ScanEditor } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { ClockService } from "src/app/services/clock.service";
import { LockerHandleService } from "src/app/services/locker-handle.service";
import { UnifyService } from "src/app/services/unify.service";
import { MarketViewModel } from "../view/market.viewmodel";
import { ScanDataModel } from "./scan.datamodel";

@Injectable({
  providedIn: 'any'
})
export class ScanEditDataModel {
  public dataAvailableMarkets = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _clockSvc: ClockService;
  private readonly _lockerHandle: LockerHandleService;

  private _subidMarketsListChangeSubscriptionId: MultiEvent.SubscriptionId;
  private _subidLifecycleChange: MultiEvent.SubscriptionId;

  private _scanStorage: ScanDataModel;
  private _initialised = false;
  private _scanEditor: ScanEditor;

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const clockSvc = inject(ClockService);
    const lockerHandleService = inject(LockerHandleService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._clockSvc = clockSvc;
    this._lockerHandle = lockerHandleService;
  }

  public get scanStorage(): ScanDataModel {
    return this._scanStorage;
  }

  public get initialised(): boolean {
    return this._initialised;
  }

  public get scanEditor(): ScanEditor {
    return this._scanEditor;
  }

  public async initialise(scanId: string) {
    this._scanStorage = new ScanDataModel(this._bundledSvc);

    if (scanId === "") {
      this._scanEditor = this._unifySvc.scansService.openNewScanEditor(this._lockerHandle, this._scanStorage.traits);
    } else if (scanId !== "") {
      const r = await this._unifySvc.scansService.tryOpenScanEditor(scanId, this._lockerHandle, () => { return this._scanStorage.traits; });
      if (r.isErr()) {
        throw new AssertInternalError('SEDMIE65591', r.error);
      } else {
        const scanEditor = r.value;
        if (scanEditor === undefined) {
          throw new AssertInternalError('SEDMIU65592', `Scan editor for scanId ${scanId} not found.`);
        } else {
          this._scanEditor = scanEditor;
        }
      }
    }
    await this._scanStorage.loadFromScanEditor(this._scanEditor);

    this._scanStorage.traits.onTraitChanged.subscribe(tr => {
      this.scanEditor.flagCriteriaAsFieldSetChanged();
      window.arclightLogger.logDebug(`Trait change: ${JSON.stringify(tr)}`);
    });

    this._subidLifecycleChange = this._scanEditor.subscribeLifeCycleStateChangeEvents(() => this.handleLifecycleStateChange());
    this.handleLifecycleStateChange();

    this.subscribeToMarkets();

    this._initialised = true;
  }

  public finalise() {
    this.checkUnsubscribeFromMarkets();
    this._scanEditor.unsubscribeLifeCycleStateChangeEvents(this._subidLifecycleChange);
  }

  // External data

  private subscribeToMarkets() {
    this._subidMarketsListChangeSubscriptionId = this._unifySvc.marketsService.defaultExchangeEnvironmentDataMarkets.subscribeListChangeEvent(() => {
      this.handleMarketsUpdate();
    });

    this.handleMarketsUpdate();
  }

  private checkUnsubscribeFromMarkets(): void {
    if (this._subidMarketsListChangeSubscriptionId !== undefined) {
      this._unifySvc.marketsService.defaultExchangeEnvironmentDataMarkets.unsubscribeListChangeEvent(this._subidMarketsListChangeSubscriptionId);
      this._subidMarketsListChangeSubscriptionId = undefined;
    }
  }

  // Handlers

  private handleMarketsUpdate() {
    const markets = this._unifySvc.marketsService.defaultExchangeEnvironmentDataMarkets.toArray().map((r) => MarketViewModel.newFromDI(this._clockSvc, this._bundledSvc, r));
    this._scanStorage.reloadAvailableMarkets(markets);
  }

  private handleLifecycleStateChange() {
    window.arclightLogger.logDebug(`Scan lifecycle state: ${this.lifecycleName(this._scanEditor.lifeCycleStateId)}`)
  }

  // Helpers

  private lifecycleName(_id: ScanEditor.LifeCycleStateId): string {
    switch (this._scanEditor.lifeCycleStateId) {
      case ScanEditor.LifeCycleStateId.Creating: return "Creating";
      case ScanEditor.LifeCycleStateId.Deleted: return "Deleted";
      case ScanEditor.LifeCycleStateId.Deleting: return "Deleting";
      case ScanEditor.LifeCycleStateId.ExistsDetailLoaded: return "ExistsDetailLoaded";
      case ScanEditor.LifeCycleStateId.ExistsInitialDetailLoading: return "ExistsInitialDetailLoading";
      case ScanEditor.LifeCycleStateId.NotYetCreated: return "NotYetCreated";
      case ScanEditor.LifeCycleStateId.Updating: return "Updating";
    }
  }
}

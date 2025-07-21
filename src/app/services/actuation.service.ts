import { Injectable, inject } from "@angular/core";
import { AssertInternalError, Integer, MultiEvent, UsableListChangeTypeId } from "@pbkware/js-utils";
import { DataIvemIdMatchesDataDefinition, DataIvemIdScanMatchesDataItem, ScansService } from "@plxtra/motif-core";
import { UnifyService } from "./unify.service";

@Injectable({
  providedIn: 'root'
})
export class ActuationService {
  private readonly _unifySvc: UnifyService;
  private readonly _scansSvc: ScansService;

  private _dataAvailableScans = false;

  private _subidScanListChange: MultiEvent.SubscriptionId;

  private _scanMatchDIs: Map<string, ActuationService.SubscriptionStorage>;

  private _activated = false;

  constructor() {
    const unifySvc = inject(UnifyService);

    this._unifySvc = unifySvc;
    this._scansSvc = unifySvc.scansService;

    this._scanMatchDIs = new Map<string, ActuationService.SubscriptionStorage>();
  }

  public get activated(): boolean {
    return this._activated;
  }
  public set activated(v: boolean) {
    if (this._activated !== v) {
      this._activated = v;
      if (this._activated)
        this.subscribeToScanMatches();
      else
        this.unsubscribeScanMatches();
    }
  }

  private subscribeToScanMatches() {
    window.arclightLogger.logInfo('In-app Scan notifications ENABLED');
    this.checkUnsubscribe();
    this.subscribeScanList();
  }

  private unsubscribeScanMatches() {
    window.arclightLogger.logInfo('In-app Scan notifications DISABLED');
    this.checkUnsubscribe();
  }

  private subscribeScanList() {
    this._subidScanListChange = this._scansSvc.scanList.subscribeListChangeEvent((changeType, idx, count) => this.handleListChange(changeType, idx, count));
    this.loadIsUsable();
    this.synchScanMatches();
  }

  private handleListChange(listChangeTypeId: UsableListChangeTypeId, index: Integer, count: Integer): void {
    switch (listChangeTypeId) {
      case UsableListChangeTypeId.AfterMove:
      case UsableListChangeTypeId.AfterReplace:
      case UsableListChangeTypeId.BeforeMove:
      case UsableListChangeTypeId.BeforeReplace:
      case UsableListChangeTypeId.PreUsableAdd:
      case UsableListChangeTypeId.PreUsableClear:
        // ignore
        break;
      case UsableListChangeTypeId.Clear:
      case UsableListChangeTypeId.Insert:
      case UsableListChangeTypeId.Remove:
        this.synchScanMatches();
        break;
      case UsableListChangeTypeId.Unusable:
        this.loadIsUsable();
        break;
      case UsableListChangeTypeId.Usable:
        this.loadIsUsable();
        this.synchScanMatches();
        break;
    }
  }

  private loadIsUsable(): void {
    this._dataAvailableScans = this._scansSvc.scanList.usable;
  }

  private synchScanMatches() {
    const scans = this._scansSvc.scanList.toArray();
    const storageKeys = this._scanMatchDIs.keys();
    // handle removes
    for (const id of storageKeys) {
      if (scans.findIndex((s) => s.id === id) === -1) {
        window.arclightLogger.logDebug(`Actuation removal of ${ id}`);
        // remove sub
        const storage = this._scanMatchDIs.get(id);
        if (storage === undefined) {
          throw new AssertInternalError('ACTSSM39112');
        } else {
          storage.di.unsubscribeUsableChangedEvent(storage.subidUsableChanged);
          storage.di.unsubscribeEndChangesEvent(storage.subidEndChanges);
          this._unifySvc.adi.unsubscribe(storage.di);
          this._scanMatchDIs.delete(id);
        }
      }
    }
    // handle adds
    scans.forEach(scn => {
      if (!this._scanMatchDIs.has(scn.id)) {
        window.arclightLogger.logDebug(`Actuation addition of ${ scn.id}`);
        // add sub
        const storage = new ActuationService.SubscriptionStorage();
        const definition = new DataIvemIdMatchesDataDefinition();
        definition.scanId = scn.id;
        storage.di = this._unifySvc.adi.subscribe(definition) as DataIvemIdScanMatchesDataItem;
        storage.subidUsableChanged = storage.di.subscribeUsableChangedEvent(() => {/**/});
        storage.subidEndChanges = storage.di.subscribeEndChangesEvent(() => {/**/});
        this._scanMatchDIs.set(scn.id, storage);
      }
    });
  }

  private checkUnsubscribe() {
    if (this._subidScanListChange) {
      this._scansSvc.scanList.unsubscribeListChangeEvent(this._subidScanListChange);
      this._subidScanListChange = undefined;
    }
  }
}

export namespace ActuationService {
  export class SubscriptionStorage {
    public di: DataIvemIdScanMatchesDataItem;
    public subidEndChanges: MultiEvent.SubscriptionId;
    public subidUsableChanged: MultiEvent.SubscriptionId;
  }
}

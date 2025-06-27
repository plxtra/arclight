import { AssertInternalError, Guid, UnreachableCaseError } from '@pbkware/js-utils';
import { DataIvemId, DataMarket, QueryScanDetailDataItem, ScanAttachedNotificationChannel, ScanEditor, ScanTargetTypeId, SymbolDetailCacheService } from "@plxtra/motif-core";
import { TraitSet } from "../../traits/trait-set";
import { SelectableEntry } from "../../types/selectable-entry";
import { BaseViewModel } from "../view/base.viewmodel";
import { MarketViewModel } from "../view/market.viewmodel";
import { NotificationViewModel } from "../view/notification.viewmodel";
import { SymbolDetailViewModel } from "../view/symbol-detail.viewmodel";

export type ScanTargetVariety = "market" | "symbol";

export class ScanDataModel extends BaseViewModel {
  private _targetMarkets: DataMarket[] = [];
  private _targetDataIvemIds: DataIvemId[] = [];
  private _targetNotificationIds: ScanAttachedNotificationChannel[] = [];

  private _id: string | undefined;

  private _version: Guid | undefined;
  private _name: string;
  private _description: string;
  private _enabled: boolean;
  private _targetTypeId: ScanTargetTypeId | undefined;
  private _targetType: ScanTargetVariety = "symbol";
  private _availableNotifications: SelectableEntry<NotificationViewModel>[] = [];
  private _traits: TraitSet = new TraitSet();
  private _availableMarkets: SelectableEntry<MarketViewModel>[] = [];
  private _selectedSymbols: SymbolDetailViewModel[] = [];

  public get id(): string | undefined{
    return this._id;
  }

  public get version(): Guid | undefined {
    return this._version;
  }

  public get name(): string {
    return this._name;
  }
  public set name(v: string) {
    this._name = v;
  }

  public get description(): string {
    return this._description;
  }
  public set description(v: string) {
    this._description = v;
  }

  public get enabled(): boolean {
    return this._enabled;
  }
  public set enabled(v: boolean) {
    this._enabled = v;
  }

  public get targetType(): ScanTargetVariety {
    return this._targetType;
  }
  public set targetType(v: ScanTargetVariety) {
    this._targetType = v;
  }

  public get selectedSymbols(): SymbolDetailViewModel[] {
    return this._selectedSymbols;
  }

  public get availableMarkets(): SelectableEntry<MarketViewModel>[] {
    return this._availableMarkets;
  }

  public get availableNotifications(): SelectableEntry<NotificationViewModel>[] {
    return this._availableNotifications;
  }

  public get selectedMarkets(): MarketViewModel[] {
    return this._availableMarkets.filter(se => se.checked).map(m => m.entry);
  }

  public get selectedNotifications(): NotificationViewModel[] {
    return this._availableNotifications.filter(se => se.checked).map(m => m.entry);
  }

  public get anySelectedNotifications(): boolean {
    return (this.selectedNotifications.length > 0);
  }

  public get isTargetSymbols(): boolean {
    return (this._targetType === "symbol");
  }

  public get isTargetMarkets(): boolean {
    return (this._targetType === "market");
  }

  public get traits(): TraitSet {
    return this._traits;
  }

  // Transformations

  // static newFromDI(di: QueryScanDetailDataItem, bundledSvc: BundledService): ScanDataModel {
  //   const model = new ScanDataModel(bundledSvc);
  //   model.loadFromDI(di);
  //   return model;
  // }

  // static newFromScanEditor(se: ScanEditor, bundledSvc: BundledService): ScanDataModel {
  //   const model = new ScanDataModel(bundledSvc);
  //   model.loadFromScanEditor(se);
  //   return model;
  // }

  private static toScanTargetVariety(src: ScanTargetTypeId | undefined): ScanTargetVariety {
    switch (src) {
      case ScanTargetTypeId.Markets: return "market";
      case ScanTargetTypeId.Symbols: return "symbol";
      case undefined: return "symbol";
      default:
        throw new UnreachableCaseError('SDMTSTV33090', src);
    }
  }

  private static toScanTargetTypeId(src: ScanTargetVariety): ScanTargetTypeId {
    switch (src) {
      case "market": return ScanTargetTypeId.Markets;
      case "symbol": return ScanTargetTypeId.Symbols;
    }
  }

  public async addSymbol(id: DataIvemId) {
    if (!this._selectedSymbols.some(s => s.id.mapKey === id.mapKey)) {
      const detail = await this.bundledService.symbolDetailCache.getDataIvemId(id)
      if (detail !== undefined) {
        this._selectedSymbols.push(SymbolDetailViewModel.newFromDI(detail, this.bundledService));
        this.resortSymbols();
      }
    }
  }

  public removeSymbol(id: DataIvemId) {
    const p = this._selectedSymbols.findIndex(s => s.id === id);
    if (p !== -1) {
      this._selectedSymbols.splice(p, 1);
    }
  }

  public selectAllMarkets() {
    this._availableMarkets.forEach(mkt => { mkt.checked = true; })
  }

  public selectNoMarkets() {
    this._availableMarkets.forEach(mkt => { mkt.checked = false; })
  }

  public async loadFromDI(di: QueryScanDetailDataItem) {
    const detail = di.descriptorAndDetail;
    this._id = detail.id;
    this._version = detail.versionId;
    this._name = detail.name;
    this._description = detail.description ?? ''
    this._enabled = true; //detail.enabled;
    this._targetType = ScanDataModel.toScanTargetVariety(detail.targetTypeId);
    this._targetMarkets = (detail.targetMarkets) ? [...detail.targetMarkets] : [];
    this._targetDataIvemIds = (detail.targetDataIvemIds) ? [...detail.targetDataIvemIds] : [];
    this._targetNotificationIds = [...detail.attachedNotificationChannels];

    await this.postLoad();
  }

  public async loadFromScanEditor(se: ScanEditor) {
    // private or informational
    this._id = se.id;
    this._version = se.scan?.versionId;
    // public and editable
    this._name = se.name;
    this._description = se.description;
    this._enabled = se.enabled;
    this._targetTypeId = se.targetTypeId;
    this._targetType = ScanDataModel.toScanTargetVariety(se.targetTypeId);
    this._targetMarkets = (se.targetMarkets) ? [...se.targetMarkets] : [];
    this._targetDataIvemIds = (se.targetDataIvemIds) ? [...se.targetDataIvemIds] : [];
    // this._targetNotificationIds = (se.notifications)? [...detail.notifications]: [];

    await this.postLoad();
  }

  public saveToScanEditor(se: ScanEditor) {
    this.preSave();

    se.setName(this._name);
    se.setDescription(this._description);
    se.setEnabled(this._enabled);
    se.setTargetTypeId(this._targetTypeId ?? ScanTargetTypeId.Symbols);
    se.setTargetMarkets(this._targetMarkets);
    se.setTargetDataIvemIds(this._targetDataIvemIds);
    // await se.attachNotificationChannel();
  }

  public reloadAvailableNotifications(notificationList: NotificationViewModel[]) {
    this._availableNotifications = notificationList
      .sort((a, b) => (a.name).localeCompare(b.name))
      .map((r) => new SelectableEntry<NotificationViewModel>(r, false));
    this.refreshSelectedNotifications();
  }

  public reloadAvailableMarkets(marketList: MarketViewModel[]) {
    this._availableMarkets = marketList
      .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""))
      .map((r) => new SelectableEntry<MarketViewModel>(r, false));
    this.refreshSelectedMarkets();
  }

  private preSave() {
    this.backfillSelectedSymbols();
    this.backfillSelectedMarkets();
    this.backfillSelectedNotifications();
  }

  private async postLoad() {
    await this.refreshSelectedSymbols();
    this.refreshSelectedMarkets();
    this.refreshSelectedNotifications();
  }

  private refreshSelectedMarkets() {
    this._availableMarkets.forEach(mkt => {
      mkt.checked = this._targetMarkets.includes(mkt.entry.market);
    });
  }

  private backfillSelectedMarkets() {
    this._targetMarkets = this._availableMarkets.filter(m => m.checked).map(m => m.entry.market);
  }

  private async refreshSelectedSymbols() {
    this._selectedSymbols = [];

    const detailPromises: Promise<SymbolDetailCacheService.DataIvemIdDetail | undefined>[] = [];
    this._targetDataIvemIds.forEach(id => {
      const detailPromise = this.bundledService.symbolDetailCache.getDataIvemId(id);
      detailPromise.then(
        detail => {
          if (detail !== undefined) {
            this.selectedSymbols.push(SymbolDetailViewModel.newFromDI(detail, this.bundledService));
          }
        },
        (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'SDMRS33090'); }
      );
      detailPromises.push(detailPromise);
    });

    if (detailPromises.length > 0) {
      await Promise.all(detailPromises);
      this.resortSymbols();
    }
  }

  private backfillSelectedSymbols() {
    this._targetDataIvemIds = this.selectedSymbols.map(s => s.id);
  }

  private refreshSelectedNotifications() {
    this._availableNotifications.forEach(not => {
      not.checked = this._targetNotificationIds.some(j => j.channelId === not.entry.id);
    });
  }

  private backfillSelectedNotifications() {
    // this._targetNotificationIds = this._availableNotifications.filter(n => n.checked).map(n => n.entry.id);
  }

  // Helpers

  private resortSymbols() {
    this._selectedSymbols.sort((a, b) => a.code.localeCompare(b.code));
  }
}

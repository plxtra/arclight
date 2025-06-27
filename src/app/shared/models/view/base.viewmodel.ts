import { SourceTzOffsetDateTime } from "@pbkware/js-utils";
import { Currency } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { DecimalFormat } from "../../types/decimal-format";
import { zCurrencyId, zDataIvemId, zDecimal, zInteger, zIvemId, znumber, zSourceTzOffsetDateTime } from "../../types/nullable-types";

export class BaseViewModel {
  private readonly _bundledSvc: BundledService;

  constructor(bundledSvc: BundledService
  ) {
    this._bundledSvc = bundledSvc;
  }

  public get bundledService(): BundledService {
    return this._bundledSvc;
  }

  protected formatNumber(num: znumber, nv = ""): string {
    if (num === undefined) return nv;
    return num.toLocaleString();
  }

  protected formatInteger(i: zInteger, nv = ""): string {
    if (i === undefined) return nv;
    return i.toLocaleString();
  }

  protected formatDecimalVolume(volume: zDecimal, nv = '') {
    if (volume === undefined) return nv;
    return volume.toNumber().toLocaleString();
  }

  protected formatMoney(d: zDecimal, nv = ""): string {
    if (d === undefined) return nv;
    return DecimalFormat.formatMoney(d);
  }

  protected fromatDateTimeTZ(dt: zSourceTzOffsetDateTime, nv = ""): string {
    if (dt === undefined) return nv;
    return SourceTzOffsetDateTime.getTimezonedDate(dt, this._bundledSvc.personalisationService.displayTimeZoneToModeId()).toLocaleString();
  }

  protected fromatTimeTZ(dt: zSourceTzOffsetDateTime, nv = ""): string {
    if (dt === undefined) return nv;
    return SourceTzOffsetDateTime.getTimezonedDate(dt, this._bundledSvc.personalisationService.displayTimeZoneToModeId()).toLocaleTimeString();
  }

  protected fromatDateTZ(dt: zSourceTzOffsetDateTime, nv = ""): string {
    if (dt === undefined) return nv;
    return SourceTzOffsetDateTime.getTimezonedDate(dt, this._bundledSvc.personalisationService.displayTimeZoneToModeId()).toLocaleDateString();
  }

  protected formatPrice(d: zDecimal, nv = ""): string {
    if (d === undefined) return nv;
    return DecimalFormat.formatPrice(d);
  }

  protected getCurrencyDescription(currencyId: zCurrencyId, nv = ""): string {
    if (currencyId === undefined) return nv;
    return Currency.idToDisplay(currencyId);
  }

  protected getIvemIdDisplay(ivemId: zIvemId): string {
    const detail = this._bundledSvc.symbolsService.ivemIdToDisplay(ivemId);
    return detail;
  }

  protected getDataIvemIdDisplay(dataIvemId: zDataIvemId): string {
    const detail = this._bundledSvc.symbolsService.dataIvemIdToDisplay(dataIvemId);
    return detail;
  }

  protected async getSymbolName(ivemId: zIvemId): Promise<string> {
    if (ivemId === undefined) return "Unknown investment item id";
    const cache = await this._bundledSvc.symbolDetailCache.getIvemId(ivemId, false, false);
    const detail = cache?.dataIvemIdDetails[0];
    if (detail === undefined) return "Unknown investment item";
    return this._bundledSvc.symbolsService.calculateSymbolName(detail.exchange, detail.name, detail.dataIvemId.code, detail.alternateCodes);
  }

  protected async getDataIvemIdName(litIvemId: zDataIvemId): Promise<string> {
    if (litIvemId === undefined) return "Unknown investment item id";
    const detail = await this._bundledSvc.symbolDetailCache.getDataIvemId(litIvemId);
    if (detail === undefined) return "Unknown investment item";
    return this._bundledSvc.symbolsService.calculateSymbolName(detail.exchange, detail.name, detail.dataIvemId.code, detail.alternateCodes);
  }

  protected getGlobalIdentifier(litIvemId: zDataIvemId): string {
    if (litIvemId === undefined) return "Unknown investment item id";
    return this._bundledSvc.unifyService.dataIvemIdToGlobalIdentifier(litIvemId);
  }
}

import { DataIvemId, SymbolDetailCacheService } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { BaseViewModel } from "./base.viewmodel";

export class SymbolDetailViewModel extends BaseViewModel {
  public id: DataIvemId;
  public code: string;
  public name: string;
  public exchange: string;

  static newFromDI(sym: SymbolDetailCacheService.DataIvemIdDetail, bundledSvc: BundledService): SymbolDetailViewModel {
    const model = new SymbolDetailViewModel(bundledSvc);
    model.loadFromDI(sym);
    return model;
  }

  private loadFromDI(sym: SymbolDetailCacheService.DataIvemIdDetail) {
    this.id = sym.dataIvemId;
    this.code = this.getDataIvemIdDisplay(sym.dataIvemId);
    this.name = sym.name;
    this.exchange = sym.exchange.abbreviatedDisplay;
  }
}

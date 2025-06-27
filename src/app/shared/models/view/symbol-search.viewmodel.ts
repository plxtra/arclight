import { SearchSymbolsDataIvemFullDetail } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { zstring } from "../../types/nullable-types";
import { BaseViewModel } from "./base.viewmodel";

export class SymbolSearchViewModel extends BaseViewModel implements SymbolSearchViewModel.Skeleton {
  public key: zstring;
  public displayCode: zstring;
  public code: string;
  public exchange: zstring;
  public market: zstring;
  public name: zstring;
  public environment: zstring;

  static newFromDI(sym: SearchSymbolsDataIvemFullDetail, bundledSvc: BundledService): SymbolSearchViewModel {
    const model = new SymbolSearchViewModel(bundledSvc);
    model.loadFromDI(sym);
    return model;
  }

  loadFromDI(sym: SearchSymbolsDataIvemFullDetail | undefined): void {
    if (sym) {
      this.key = sym.key.mapKey;
      this.code = this.getDataIvemIdDisplay(sym.dataIvemId);
      this.exchange = sym.exchange.abbreviatedDisplay;
      this.market = sym.market.display;
      this.name = sym.name;
      this.environment = sym.exchangeEnvironment.display;
    }
  }
}

export namespace SymbolSearchViewModel {
  export interface Skeleton {
    readonly key?: string,
    readonly code?: string,
    readonly exchange?: string,
    readonly name?: string,
  }
}

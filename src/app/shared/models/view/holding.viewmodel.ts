import { Holding } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { zDecimal, zIvemId, znumber, zstring } from "../../types/nullable-types";
import { BaseViewModel } from "./base.viewmodel";

export class HoldingViewModel extends BaseViewModel {
  public ivemId: zIvemId;
  public accountIdDisplay: zstring;
  public accountName: zstring;
  public code: zstring;
  public name: zstring;
  public exchange: zstring;
  public totalQuantity: znumber;
  public totalAvailableQuantity: znumber;
  public averagePrice: zDecimal;
  public costValue: zDecimal;
  public environment: zstring;
  public currency: zstring;

  public get totalQuantityDisplay(): string {
    return this.formatNumber(this.totalQuantity);
  }

  public get totalAvailableQuantityDisplay(): string {
    return this.formatNumber(this.totalAvailableQuantity);
  }

  public get costValueDisplay(): string {
    return this.formatMoney(this.costValue);
  }

  public get averagePriceDisplay(): string {
    return this.formatMoney(this.averagePrice);
  }

  static async newFromDI(hld: Holding, bundledSvc: BundledService): Promise<HoldingViewModel> {
    const model = new HoldingViewModel(bundledSvc);
    await model.loadFromDI(hld);
    return model;
  }

  async loadFromDI(hld: Holding | undefined) {
    if (hld) {
      this.ivemId = hld.ivemId;
      this.accountIdDisplay = hld.account.id.display;
      this.accountName = this.bundledService.brokerageAccountsService.findAccount(hld.account.zenithCode)?.name;
      this.code = this.getIvemIdDisplay(hld.ivemId);
      this.name = await this.getSymbolName(hld.ivemId);
      this.exchange = hld.exchange.abbreviatedDisplay;
      this.environment = hld.exchange.exchangeEnvironment.display;
      this.currency = this.getCurrencyDescription(hld.currencyId);
      this.totalAvailableQuantity = hld.totalAvailableQuantity
      this.totalQuantity = hld.totalQuantity;
      this.averagePrice = hld.averagePrice;
    }
  }
}

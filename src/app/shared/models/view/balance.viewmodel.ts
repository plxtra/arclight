import { Balances } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { zDecimal, zstring } from "../../types/nullable-types";
import { BaseViewModel } from "./base.viewmodel";

export class BalanceViewModel extends BaseViewModel {
  public accountIdDisplay: zstring;
  public accountName: zstring;
  public currency: zstring;
  public nett: zDecimal;
  public trading: zDecimal;
  public nonTrading: zDecimal;
  public unfilledBuys: zDecimal;
  public margin: zDecimal;

  public get nettDisplay(): string { return this.formatMoney(this.nett); }
  public get tradingDisplay(): string { return this.formatMoney(this.trading); }
  public get nonTradingDisplay(): string { return this.formatMoney(this.nonTrading); }
  public get unfilledBuysDisplay(): string { return this.formatMoney(this.unfilledBuys); }
  public get marginDisplay(): string { return this.formatMoney(this.margin); }

  static newFromDI(bal: Balances, bundledSvc: BundledService): BalanceViewModel {
    const model = new BalanceViewModel(bundledSvc);
    model.loadFromDI(bal);
    return model;
  }

  loadFromDI(bal: Balances | undefined): void {
    if (bal) {
      this.accountIdDisplay = bal.accountId.display;
      this.accountName = this.bundledService.brokerageAccountsService.findAccount(bal.account.zenithCode)?.name ?? "";
      this.currency = this.getCurrencyDescription(bal.currencyId);
      this.nett = bal.netBalance;
      this.trading = bal.trading;
      this.nonTrading = bal.nonTrading;
      this.unfilledBuys = bal.unfilledBuys;
      this.margin = bal.margin;
    }
  }
}

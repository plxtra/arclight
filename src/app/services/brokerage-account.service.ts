import { Injectable } from '@angular/core';
import { AdiService, BrokerageAccount, BrokerageAccountsDataDefinition, BrokerageAccountsDataItem } from '@plxtra/motif-core';
import { UnifyService } from './unify.service';

@Injectable({
  providedIn: 'root'
})
export class BrokerageAccountService {
  private readonly _adiSvc: AdiService;

  private _tradingAccountsDI: BrokerageAccountsDataItem | undefined;

  constructor(unifySvc: UnifyService) {
    this._adiSvc = unifySvc.adi;
    this.subscribeToTradingAccounts();
  }

  public get accountList() {
    if (this.isTradingAccountsDIUsable(this._tradingAccountsDI)) {
      return this._tradingAccountsDI.records;
    }
    return [];
  }

  finalise() {
    this.checkUnsubscribeFromTradingAccounts();
  }

  public findAccount(accountZenithCode: string): BrokerageAccount | undefined {
    if (accountZenithCode && this.isTradingAccountsDIUsable(this._tradingAccountsDI)) {
      const idx = this._tradingAccountsDI.records.findIndex((avm) => avm.zenithCode === accountZenithCode);
      if (idx !== -1) return this._tradingAccountsDI.records[idx];
    }
    return undefined;
  }

  private isTradingAccountsDIUsable(tradingAccountsDI: BrokerageAccountsDataItem | undefined): tradingAccountsDI is BrokerageAccountsDataItem {
    return tradingAccountsDI !== undefined && tradingAccountsDI.usable;
  }

  private subscribeToTradingAccounts() {
    const definition = new BrokerageAccountsDataDefinition();
    this._tradingAccountsDI = this._adiSvc.subscribe(definition) as BrokerageAccountsDataItem;
  }

  private checkUnsubscribeFromTradingAccounts() {
    if (this._tradingAccountsDI !== undefined) {
      this._adiSvc.unsubscribe(this._tradingAccountsDI);
    }
  }
}

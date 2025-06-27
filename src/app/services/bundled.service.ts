import { Injectable } from '@angular/core';
import { MarketsService, SymbolDetailCacheService, SymbolsService } from '@plxtra/motif-core';
import { BrokerageAccountService } from './brokerage-account.service';
import { PersonalisationService } from './personalisation.service';
import { UnifyService } from './unify.service';

@Injectable({
  providedIn: 'root'
})
export class BundledService {
  private readonly _brokerageAccountSvc: BrokerageAccountService;
  private readonly _personalisationSvc: PersonalisationService;
  private readonly _unifySvc: UnifyService;

  constructor(
    brokerageAccountSvc: BrokerageAccountService,
    personalisationSvc: PersonalisationService,
    unifySvc: UnifyService,
  ) {
    this._brokerageAccountSvc = brokerageAccountSvc;
    this._personalisationSvc = personalisationSvc;
    this._unifySvc = unifySvc;
  }

  public get brokerageAccountsService(): BrokerageAccountService { return this._brokerageAccountSvc; }
  public get personalisationService(): PersonalisationService { return this._personalisationSvc; }
  public get marketsService(): MarketsService { return this._unifySvc.marketsService; }
  public get symbolsService(): SymbolsService { return this._unifySvc.symbolsService; }
  public get symbolDetailCache(): SymbolDetailCacheService { return this._unifySvc.symbolDetailCache; }
  public get unifyService(): UnifyService { return this._unifySvc; }
}

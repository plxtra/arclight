import { Injectable, OnDestroy, inject } from '@angular/core';
import { DecimalFactory } from '@pbkware/js-utils';
import {
    AdiService,
    AppStorageService,
    CommandRegisterService,
    CoreService,
    DataIvemId,
    DataMarket,
    MarketsService,
    MotifServicesService,
    NotificationChannelsService,
    ScansService,
    SessionInfoService,
    SettingsService,
    SymbolDetailCacheService,
    SymbolsService
} from '@plxtra/motif-core';
import { DecimalFactoryService } from './decimal-factory-service';

@Injectable({
  providedIn: 'root'
})
export class UnifyService implements OnDestroy {
  private readonly _coreService: CoreService;
  private readonly _sessionInfoService: SessionInfoService;

  constructor() {
    const decimalFactoryService = inject(DecimalFactoryService);

    this._coreService = new CoreService(decimalFactoryService);
    this._sessionInfoService = new SessionInfoService();
  }

  get coreService() { return this._coreService; }
  get decimalFactory(): DecimalFactory { return this._coreService.decimalFactory; }
  get marketsService(): MarketsService { return this._coreService.marketsService; }
  get settingsService(): SettingsService { return this._coreService.settingsService; }
  get motifServicesService(): MotifServicesService { return this._coreService.motifServicesService; }
  get appStorageService(): AppStorageService { return this._coreService.appStorageService; }
  get adi(): AdiService { return this._coreService.adiService; }
  get symbolsService(): SymbolsService { return this._coreService.symbolsService; }
  get symbolDetailCache(): SymbolDetailCacheService { return this._coreService.symbolDetailCacheService; }
  get commandRegisterService(): CommandRegisterService { return this._coreService.commandRegisterService; }
  get scansService(): ScansService { return this._coreService.scansService; }
  get notificationChannelsService(): NotificationChannelsService { return this._coreService.notificationChannelsService; }
  get sessionInfoService(): SessionInfoService { return this._sessionInfoService;}

  ngOnDestroy() {
    this._coreService.finalise();
  }

  public dataIvemIdToGlobalIdentifier(dataIvemId: DataIvemId): string {
    // return this.symbolsManager.litIvemIdToDisplay(litIvemId);
    // -> do this manually since we need to force FULL FORMAT but library follows global setting for reduction
    const code = dataIvemId.code;
    const exchange = dataIvemId.exchange;
    const market = dataIvemId.market;
    const fullDisplay = `${code}${this.symbolsService.pscExchangeAnnouncerChar}${exchange.symbologyCode}${this.symbolsService.pscMarketAnnouncerChar}${market.symbologyCode}`;
    return fullDisplay;
  }

  public parseDataIvemId(value: string): SymbolsService.MarketIvemIdParseDetails<DataMarket> {
    return this.symbolsService.parseDataIvemId(value);
  }
}

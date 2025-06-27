import { DataMarket, TradingState } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { ClockService } from "src/app/services/clock.service";
import { zSourceTzOffsetDate, zSourceTzOffsetDateTime, zSubscription, zstring } from "../../types/nullable-types";
import { BaseViewModel } from "./base.viewmodel";

export class MarketViewModel extends BaseViewModel {
  public market: DataMarket;
  public code: zstring;
  public name: zstring;
  public environment: zstring;
  public status: zstring;
  public display: zstring;
  public tradingDate: zSourceTzOffsetDate;
  public marketTime: zSourceTzOffsetDateTime;
  public allowedTradingStates: string[] = [];
  public reason: zstring;
  public boards: BoardStatusViewModel[] = [];

  public usable = false;

  public currentMarketTime: zSourceTzOffsetDateTime;
  private _tzClockSub: zSubscription;

  constructor(private clockSvc: ClockService, bundledSvc: BundledService) {
    super(bundledSvc);
  }

  public get currentMarketTimeDisplay(): string { return this.fromatDateTimeTZ(this.currentMarketTime); }

  static newFromDI(clockSvc: ClockService, bundledSvc: BundledService, mkt: DataMarket): MarketViewModel {
    const model = new MarketViewModel(clockSvc, bundledSvc);
    model.loadFromDI(mkt);
    return model;
  }

  public loadFromDI(mkt: DataMarket): void {
    this.market = mkt;
    this.code = mkt.symbologyCode;
    this.name = mkt.name;
    this.environment = mkt.exchangeEnvironment.display;
    this.status = mkt.status;
    this.display = mkt.display;
    this.tradingDate = mkt.tradingDate;
    this.marketTime = mkt.marketTime;
    this.allowedTradingStates = mkt.tradingStates.map((st) => st.name);
    this.reason = (mkt.reasonId === undefined)
      ? ""
      : TradingState.Reason.idToDisplay(mkt.reasonId);
    const boards = mkt.marketBoards;
    const boardCount = boards.count;
    const models = new Array<BoardStatusViewModel>(boardCount);
    for (let i = 0; i < boardCount; i++) {
      const board = boards.getAt(i);
      const model = new BoardStatusViewModel()
      model.board = board.display;
      model.status = board.status;
      models[i] = model;
    }
    this.boards = models;

    this.release();

    this._tzClockSub = this.clockSvc.utcTime.subscribe((utc) => {
      this.currentMarketTime = {
        utcDate: utc,
        offset: this.marketTime?.offset ?? 0,
      };
    });
  }

  release() {
    if (this._tzClockSub) {
      this._tzClockSub.unsubscribe();
    }
  }
}

export class BoardStatusViewModel {
  public board: zstring;
  public status: zstring;
}

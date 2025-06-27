import { AssertInternalError } from '@pbkware/js-utils';
import { CallOrPut, DataIvemId, IvemClass, Market, PublisherSubscriptionDataType, PublisherSubscriptionDataTypeId, SecurityDataItem, TradingState } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { zDecimal, zMovementId, zSecurityDataItem, zSourceTzOffsetDate, zThrottledChangeDetector, zboolean, znumber, zstring } from "../../types/nullable-types";
import { ScaledChangeAutoReset } from "../../types/scaled-change-autoreset";
import { RecentMovement } from "../../types/shared-types";
import { UnscaledChangeAutoReset } from "../../types/unscaled-change-autoreset";
import { BaseViewModel } from "./base.viewmodel";

export class SecurityViewModel extends BaseViewModel {
  public code: string;
  public exchange: zstring;
  public market: zstring;
  public name: zstring;
  public class: zstring;
  public cfi: zstring;
  public tradingState: zstring;
  public tradingStateAllows: zstring;
  public tradingStateReason: zstring;
  public tradingMarkets: zstring;
  public isIndex: zboolean;
  public expiryDate: zSourceTzOffsetDate;
  public strikePrice: zDecimal;
  public callOrPut: zstring;
  public contractSize: zDecimal;
  public subscriptionData: zstring;
  public quotationBasis: readonly string[] | undefined;
  public open: zDecimal;
  public high: zDecimal;
  public low: zDecimal;
  public close: zDecimal;
  public settlement: zDecimal;
  public last: zDecimal;
  public trend: zMovementId;
  public bestAsk: zDecimal;
  public askCount: znumber;
  public askQuantity: zDecimal;
  public askUndisclosed: zboolean;
  public bestBid: zDecimal;
  public bidCount: znumber;
  public bidQuantity: zDecimal;
  public bidUndisclosed: zboolean;
  public numberOfTrades: znumber;
  public volume: zDecimal;
  public auctionPrice: zDecimal;
  public auctionQuantity: zDecimal;
  public auctionRemainder: zDecimal;
  public vWAP: zDecimal;
  public valueTraded: zDecimal;
  public openInterest: znumber;
  public shareIssue: zDecimal;
  public statusNote: readonly string[] | undefined;
  public usable = false;
  // manufactured
  public lastOrClose: zDecimal;

  // display
  public openDisplay: zstring;
  public highDisplay: zstring;
  public lowDisplay: zstring;
  public closeDisplay: zstring;
  public lastDisplay: zstring;
  public lastOrCloseDisplay: zstring;
  public bestAskDisplay: zstring;
  public askCountDisplay: zstring;
  public askQuantityDisplay: zstring;
  public bestBidDisplay: zstring;
  public bidCountDisplay: zstring;
  public bidQuantityDisplay: zstring;
  public numberOfTradesDisplay: zstring;
  public volumeDisplay: zstring;
  public vWAPDisplay: zstring;
  public auctionPriceDisplay: zstring;
  public auctionQuantityDisplay: zstring;
  public auctionRemainderDisplay: zstring;
  public shareIssueDisplay: zstring;
  public contractSizeDisplay: zstring;
  public todayDeltaDisplay: zstring;
  // non-visible
  public globalIdentifier: zstring;
  public mapKey: zstring;
  public hasAssetData: boolean;
  public hasTradeData: boolean;
  public hasDepthFull: boolean;
  public hasDepthShort: boolean;
  public hasDepthAny: boolean;
  public hasNews: boolean;

  private _todayDelta: zDecimal;

  // changes
  private _recordAutoReset: UnscaledChangeAutoReset;

  private _lastAutoReset: ScaledChangeAutoReset;
  private _openAutoReset: UnscaledChangeAutoReset;
  private _highAutoReset: UnscaledChangeAutoReset;
  private _lowAutoReset: UnscaledChangeAutoReset;
  private _closeAutoReset: UnscaledChangeAutoReset;

  private _bestAskAutoReset: UnscaledChangeAutoReset;
  private _askCountAutoReset: UnscaledChangeAutoReset;
  private _askQuantityAutoReset: UnscaledChangeAutoReset;
  private _askUndisclosedAutoReset: UnscaledChangeAutoReset;

  private _bestBidAutoReset: UnscaledChangeAutoReset;
  private _bidCountAutoReset: UnscaledChangeAutoReset;
  private _bidQuantityAutoReset: UnscaledChangeAutoReset;
  private _bidUndisclosedAutoReset: UnscaledChangeAutoReset;

  private _numberOfTradesAutoReset: UnscaledChangeAutoReset;
  private _volumeAutoReset: UnscaledChangeAutoReset;
  private _auctionPriceAutoReset: UnscaledChangeAutoReset;
  private _auctionQuantityAutoReset: UnscaledChangeAutoReset;
  private _auctionRemainderAutoReset: UnscaledChangeAutoReset;
  private _vWAPAutoReset: UnscaledChangeAutoReset;
  private _valueTradedAutoReset: UnscaledChangeAutoReset;

  private _tradingStateAutoReset: UnscaledChangeAutoReset;
  private _tradingStateAllowsAutoReset: UnscaledChangeAutoReset;
  private _tradingStateReasonAutoReset: UnscaledChangeAutoReset;
  private _tradingMarketsAutoReset: UnscaledChangeAutoReset;
  private _isIndexAutoReset: UnscaledChangeAutoReset;
  private _expiryDateAutoReset: UnscaledChangeAutoReset;
  private _strikePriceAutoReset: UnscaledChangeAutoReset;
  private _callOrPutAutoReset: UnscaledChangeAutoReset;
  private _contractSizeAutoReset: UnscaledChangeAutoReset;
  private _subscriptionDataAutoReset: UnscaledChangeAutoReset;
  private _quotationBasisAutoReset: UnscaledChangeAutoReset;
  private _settlementAutoReset: UnscaledChangeAutoReset;
  private _openInterestAutoReset: UnscaledChangeAutoReset;
  private _shareIssueAutoReset: UnscaledChangeAutoReset;
  private _statusNoteAutoReset: UnscaledChangeAutoReset;
  private _classAutoReset: UnscaledChangeAutoReset;
  private _cfiAutoReset: UnscaledChangeAutoReset;
  private _marketAutoReset: UnscaledChangeAutoReset;
  private _todayDeltaAutoReset: UnscaledChangeAutoReset;

  constructor(bundledSvc: BundledService, tcd: zThrottledChangeDetector) {
    super(bundledSvc);
    const changeInterval = bundledSvc.personalisationService.highlightTime;
    this._recordAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);

    this._lastAutoReset = new ScaledChangeAutoReset(tcd, changeInterval);
    this._openAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._highAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._lowAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._closeAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);

    this._bestAskAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._askCountAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._askQuantityAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._askUndisclosedAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);

    this._bestBidAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._bidCountAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._bidQuantityAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._bidUndisclosedAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);

    this._numberOfTradesAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._volumeAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._auctionPriceAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._auctionQuantityAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._auctionRemainderAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._vWAPAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._valueTradedAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);

    this._tradingStateAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._tradingStateAllowsAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._tradingStateReasonAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._tradingMarketsAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._isIndexAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._expiryDateAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._strikePriceAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._callOrPutAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._contractSizeAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._subscriptionDataAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._quotationBasisAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._settlementAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._openInterestAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._shareIssueAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._statusNoteAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._classAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._cfiAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._marketAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
    this._todayDeltaAutoReset = new UnscaledChangeAutoReset(tcd, changeInterval);
  }

  public get todayDelta(): zDecimal {
    return this._todayDelta;
  }
  public set todayDelta(v: zDecimal) {
    if ((this._todayDelta !== undefined && v !== undefined && !this._todayDelta.eq(v)) || (this.todayDelta !== v)) {
      if (this._todayDelta) this._todayDeltaAutoReset.markAsChanged();
      this._todayDelta = v;
    }
  }

  // Changes
  public get recordChanged(): boolean { return this._recordAutoReset.Changed; }
  public get lastOrCloseChanged(): RecentMovement {
    if (this.last) return (this._lastAutoReset.changed)
    return this._closeAutoReset.Changed ? RecentMovement.UPDATE : RecentMovement.UNCHANGED;
  }
  public get lastChanged(): RecentMovement { return this._lastAutoReset.changed; }
  public get openChanged(): boolean { return this._openAutoReset.Changed; }
  public get highChanged(): boolean { return this._highAutoReset.Changed; }
  public get lowChanged(): boolean { return this._lowAutoReset.Changed; }
  public get closeChanged(): boolean { return this._closeAutoReset.Changed; }
  public get bestAskChanged(): boolean { return this._bestAskAutoReset.Changed; }
  public get askCountChanged(): boolean { return this._askCountAutoReset.Changed; }
  public get askQuantityChanged(): boolean { return this._askQuantityAutoReset.Changed; }
  public get askUndisclosedChanged(): boolean { return this._askUndisclosedAutoReset.Changed; }
  public get bestBidChanged(): boolean { return this._bestBidAutoReset.Changed; }
  public get bidCountChanged(): boolean { return this._bidCountAutoReset.Changed; }
  public get bidQuantityChanged(): boolean { return this._bidQuantityAutoReset.Changed; }
  public get bidUndisclosedChanged(): boolean { return this._bidUndisclosedAutoReset.Changed; }
  public get numberOfTradesChanged(): boolean { return this._numberOfTradesAutoReset.Changed; }
  public get volumeChanged(): boolean { return this._volumeAutoReset.Changed; }
  public get auctionPriceChanged(): boolean { return this._auctionPriceAutoReset.Changed; }
  public get auctionQuantityChanged(): boolean { return this._auctionQuantityAutoReset.Changed; }
  public get auctionRemainderChanged(): boolean { return this._auctionRemainderAutoReset.Changed; }
  public get vWAPChanged(): boolean { return this._vWAPAutoReset.Changed; }
  public get valueTradedChanged(): boolean { return this._valueTradedAutoReset.Changed; }
  public get tradingStateChanged(): boolean { return this._tradingStateAutoReset.Changed; }
  public get tradingStateAllowsChanged(): boolean { return this._tradingStateAllowsAutoReset.Changed; }
  public get tradingStateReasonChanged(): boolean { return this._tradingStateReasonAutoReset.Changed; }
  public get tradingMarketsChanged(): boolean { return this._tradingMarketsAutoReset.Changed; }
  public get isIndexChanged(): boolean { return this._isIndexAutoReset.Changed; }
  public get expiryDateChanged(): boolean { return this._expiryDateAutoReset.Changed; }
  public get strikePriceChanged(): boolean { return this._strikePriceAutoReset.Changed; }
  public get callOrPutChanged(): boolean { return this._callOrPutAutoReset.Changed; }
  public get contractSizeChanged(): boolean { return this._contractSizeAutoReset.Changed; }
  public get subscriptionDataChanged(): boolean { return this._subscriptionDataAutoReset.Changed; }
  public get quotationBasisChanged(): boolean { return this._quotationBasisAutoReset.Changed; }
  public get settlementChanged(): boolean { return this._settlementAutoReset.Changed; }
  public get openInterestChanged(): boolean { return this._openInterestAutoReset.Changed; }
  public get shareIssueChanged(): boolean { return this._shareIssueAutoReset.Changed; }
  public get statusNoteChanged(): boolean { return this._statusNoteAutoReset.Changed; }
  public get classChanged(): boolean { return this._classAutoReset.Changed; }
  public get cfiChanged(): boolean { return this._cfiAutoReset.Changed; }
  public get marketChanged(): boolean { return this._marketAutoReset.Changed; }
  public get todayDeltaChanged(): boolean { return this._todayDeltaAutoReset.Changed; }
  // view helpers
  public get isTodayDeltaIncrease(): boolean { return (this.todayDelta !== undefined && this.todayDelta.greaterThan(0)); }
  public get isTodayDeltaDecrease(): boolean { return (this.todayDelta !== undefined && this.todayDelta.lessThan(0)); }
  public get isTodayDeltaStatic(): boolean { return (this.todayDelta !== undefined && this.todayDelta.eq(0)); }

  static newFromDI(sec: SecurityDataItem, bundledSvc: BundledService, tcd: zThrottledChangeDetector): SecurityViewModel {
    const model = new SecurityViewModel(bundledSvc, tcd);
    model.loadFromDI(sec);
    model.loadChangeNewRecord();
    return model;
  }

  loadFromDI(sec: zSecurityDataItem): void {
    if (sec === undefined) return;

    const definition = sec.definition;
    const market = this.bundledService.marketsService.getDataMarketOrUnknown(definition.marketZenithCode);
    const dataIvemId = new DataIvemId(definition.code, market);

    // async lookups
    this.getDataIvemIdName(dataIvemId).then(
      (name) => { this.name = name },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'SVMLFDI55592'); }
    );
    // displayable
    this.code = this.getDataIvemIdDisplay(dataIvemId);
    this.exchange = sec.exchange.abbreviatedDisplay;
    this.market = sec.market.display;
    this.class = sec.class !== undefined ? IvemClass.idToDisplay(sec.class) : "";
    this.cfi = sec.cfi;
    this.tradingState = sec.tradingState;
    this.tradingStateAllows = (sec.tradingStateAllowIds !== undefined) ? sec.tradingStateAllowIds.reduce((pre, cur) => pre.concat(" ").concat(TradingState.Allow.idToDisplay(cur)).concat(","), "").trim() : "";
    this.tradingStateReason = (sec.tradingStateReasonId !== undefined) ? TradingState.Reason.idToDisplay(sec.tradingStateReasonId) : "";
    this.tradingMarkets = (sec.tradingMarkets === undefined) ? '' : Market.arrayToDisplaysCommaText(sec.tradingMarkets);
    this.isIndex = sec.isIndex;
    this.expiryDate = sec.expiryDate;
    this.strikePrice = sec.strikePrice;
    this.callOrPut = (sec.callOrPutId !== undefined) ? CallOrPut.idToDisplay(sec.callOrPutId) : undefined;
    this.contractSize = sec.contractSize;
    this.subscriptionData = (sec.subscriptionDataTypeIds !== undefined) ? sec.subscriptionDataTypeIds.reduce((pre, cur) => pre.concat(" ").concat(PublisherSubscriptionDataType.idToDisplay(cur)), "").trim() : "";
    this.quotationBasis = sec.quotationBasis;
    this.open = sec.open;
    this.high = sec.high;
    this.low = sec.low;
    this.close = sec.close;
    this.settlement = sec.settlement;
    this.last = sec.last;
    this.trend = sec.trend;
    this.bestAsk = sec.bestAsk;
    this.askCount = sec.askCount;
    this.askQuantity = sec.askQuantity;
    this.askUndisclosed = sec.askUndisclosed;
    this.bestBid = sec.bestBid;
    this.bidCount = sec.bidCount;
    this.bidQuantity = sec.bidQuantity;
    this.bidUndisclosed = sec.bidUndisclosed;
    this.numberOfTrades = sec.numberOfTrades;
    this.volume = sec.volume;
    this.auctionPrice = sec.auctionPrice;
    this.auctionQuantity = sec.auctionQuantity;
    this.auctionRemainder = sec.auctionRemainder;
    this.vWAP = sec.vWAP;
    this.valueTraded = sec.valueTraded;
    this.openInterest = sec.openInterest;
    this.shareIssue = sec.shareIssue;
    this.statusNote = sec.statusNote;
    // meta
    this.usable = sec.usable;
    // non-visible
    this.globalIdentifier = this.getGlobalIdentifier(dataIvemId);
    this.mapKey = dataIvemId.mapKey;
    // calculated
    this.lastOrClose = this.last ?? this.close;
    this.todayDelta = (this.close !== undefined && this.lastOrClose !== undefined) ? this.lastOrClose.sub(this.close) : undefined;
    this.hasAssetData = sec.subscriptionDataTypeIds?.includes(PublisherSubscriptionDataTypeId.Asset) ?? false;
    this.hasTradeData = sec.subscriptionDataTypeIds?.includes(PublisherSubscriptionDataTypeId.Trades) ?? false;
    this.hasNews = false; // not yet supported
    this.hasDepthFull = sec.subscriptionDataTypeIds?.includes(PublisherSubscriptionDataTypeId.DepthFull) ?? false;
    this.hasDepthShort = sec.subscriptionDataTypeIds?.includes(PublisherSubscriptionDataTypeId.DepthShort) ?? false;
    this.hasDepthAny = this.hasDepthFull || this.hasDepthShort;
  // displays
    this.openDisplay = this.formatPrice(this.open);
    this.highDisplay = this.formatPrice(this.high);
    this.lowDisplay = this.formatPrice(this.low);
    this.closeDisplay = this.formatPrice(this.close);
    this.lastDisplay = this.formatPrice(this.last);
    this.lastOrCloseDisplay = this.formatPrice(this.lastOrClose);
    this.bestAskDisplay = this.formatPrice(this.bestAsk);
    this.askCountDisplay = this.formatNumber(this.askCount);
    this.askQuantityDisplay = this.formatDecimalVolume(this.askQuantity);
    this.bestBidDisplay = this.formatPrice(this.bestBid);
    this.bidCountDisplay = this.formatNumber(this.bidCount);
    this.bidQuantityDisplay = this.formatDecimalVolume(this.bidQuantity);
    this.numberOfTradesDisplay = this.formatNumber(this.numberOfTrades);
    this.volumeDisplay = this.formatDecimalVolume(this.volume);
    this.vWAPDisplay = this.formatPrice(this.vWAP);
    this.auctionPriceDisplay = this.formatPrice(this.auctionPrice);
    this.auctionQuantityDisplay = this.formatDecimalVolume(this.auctionQuantity);
    this.auctionRemainderDisplay = this.formatDecimalVolume(this.auctionRemainder);
    this.shareIssueDisplay = this.formatNumber(this.shareIssue?.toNumber());
    this.contractSizeDisplay = this.formatNumber(this.contractSize?.toNumber());
    this.todayDeltaDisplay = this.formatPrice(this.todayDelta);
  }

  loadChanges(valueChanges: SecurityDataItem.ValueChange[]): void {
    valueChanges.forEach(chg => {
      switch (chg.fieldId) {
        case SecurityDataItem.FieldId.Last:
          this._lastAutoReset.markAsChanged(RecentMovement.asRecentMovement(chg.recentChangeTypeId));
          break;
        case SecurityDataItem.FieldId.Open:
          this._openAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.High:
          this._highAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Low:
          this._lowAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Close:
          this._closeAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.BestAsk:
          this._bestAskAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.AskCount:
          this._askCountAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.AskQuantity:
          this._askQuantityAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.AskUndisclosed:
          this._askUndisclosedAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.BestBid:
          this._bestBidAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.BidCount:
          this._bidCountAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.BidQuantity:
          this._bidQuantityAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.BidUndisclosed:
          this._bidUndisclosedAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.NumberOfTrades:
          this._numberOfTradesAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Volume:
          this._volumeAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.AuctionPrice:
          this._auctionPriceAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.AuctionQuantity:
          this._auctionQuantityAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.AuctionRemainder:
          this._auctionRemainderAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.VWAP:
          this._vWAPAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.ValueTraded:
          this._valueTradedAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.TradingState:
          this._tradingStateAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.TradingStateAllows:
          this._tradingStateAllowsAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.TradingStateReason:
          this._tradingStateReasonAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.TradingMarkets:
          this._tradingMarketsAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.IsIndex:
          this._isIndexAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.ExpiryDate:
          this._expiryDateAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.StrikePrice:
          this._strikePriceAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.CallOrPut:
          this._callOrPutAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.ContractSize:
          this._contractSizeAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.SubscriptionDataTypeIds:
          this._subscriptionDataAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.QuotationBasis:
          this._quotationBasisAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Settlement:
          this._settlementAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.OpenInterest:
          this._openInterestAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.ShareIssue:
          this._shareIssueAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.StatusNote:
          this._statusNoteAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Class:
          this._classAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Cfi:
          this._cfiAutoReset.markAsChanged();
          break;
        case SecurityDataItem.FieldId.Market:
          this._marketAutoReset.markAsChanged();
          break;
      }
    });
  }

  loadChangeNewRecord() {
    this._recordAutoReset.markAsChanged();
  }
}


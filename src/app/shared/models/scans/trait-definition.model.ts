import { TraitInformation } from "./trait-information.model";
import { TraitStyle } from "./trait-style.type";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TraitDefinitionModel {
  public static AltCode = "AltCode";
  public static Attribute = "Attribute";
  public static Auction = "Auction";
  public static AuctionLast = "AuctionLast";
  public static AuctionQuantity = "AuctionQuantity";
  public static BestAskCount = "BestAskCount";
  public static BestAskPrice = "BestAskPrice";
  public static BestAskQuantity = "BestAskQuantity";
  public static BestBidCount = "BestBidCount";
  public static BestBidPrice = "BestBidPrice";
  public static BestBidQuantity = "BestBidQuantity";
  public static Board = "Board";
  public static CallOrPut = "CallOrPut";
  public static Category = "Category";
  public static CFI = "CFI";
  public static Class = "Class";
  public static ClosePrice = "ClosePrice";
  public static Code = "Code";
  public static ContractSize = "ContractSize";
  public static Currency = "Currency";
  public static Data = "Data";
  public static Date = "Date";
  public static ExerciseType = "ExerciseType";
  public static Exchange = "Exchange";
  public static ExpiryDate = "ExpiryDate";
  public static HighPrice = "HighPrice";
  public static IsIndex = "IsIndex";
  public static Leg = "Leg";
  public static LastPrice = "LastPrice";
  public static LotSize = "LotSize";
  public static LowPrice = "LowPrice";
  public static Market = "Market";
  public static Name = "Name";
  public static OpenInterest = "OpenInterest";
  public static OpenPrice = "OpenPrice";
  public static Price = "Price";
  public static PreviousClose = "PreviousClose";
  public static QuotationBasis = "QuotationBasis";
  public static Remainder = "Remainder";
  public static ShareIssue = "ShareIssue";
  public static State = "State";
  public static StateAllows = "StateAllows";
  public static StatusNote = "StatusNote";
  public static StrikePrice = "StrikePrice";
  public static Trades = "Trades";
  public static TradingMarket = "TradingMarket";
  public static ValueTraded = "ValueTraded";
  public static Volume = "Volume";
  public static VWAP = "VWAP";

  private static lookup: Map<string, TraitInformation> = new Map<string, TraitInformation>([
    [TraitDefinitionModel.AltCode, { description: "Alternate Code", style: "NamedText" }],
    [TraitDefinitionModel.Attribute, { description: "Attribute", style: "NamedText" }],
    [TraitDefinitionModel.Auction, { description: "Auction Price", style: "NumericRange" }],
    [TraitDefinitionModel.AuctionLast, { description: "Auction Or Last Price", style: "NumericRange" }],
    [TraitDefinitionModel.AuctionQuantity, { description: "Auction Quantity", style: "NumericRange" }],
    [TraitDefinitionModel.Remainder, { description: "Auction Remainder", style: "NumericRange" }],
    [TraitDefinitionModel.BestAskCount, { description: "Best Ask Count", style: "NumericRange" }],
    [TraitDefinitionModel.BestAskPrice, { description: "Best Ask Price", style: "NumericRange" }],
    [TraitDefinitionModel.BestAskQuantity, { description: "Best Ask Quantity", style: "NumericRange" }],
    [TraitDefinitionModel.BestBidCount, { description: "Best Bid Count", style: "NumericRange" }],
    [TraitDefinitionModel.BestBidPrice, { description: "Best Bid Price", style: "NumericRange" }],
    [TraitDefinitionModel.BestBidQuantity, { description: "Best Bid Quantity", style: "NumericRange" }],
    [TraitDefinitionModel.Board, { description: "Board", style: "TextMultiple" }],
    [TraitDefinitionModel.CallOrPut, { description: "Call Or Put", style: "TextSingleExists" }],
    [TraitDefinitionModel.Category, { description: "Category", style: "TextMultiple" }],
    [TraitDefinitionModel.CFI, { description: "CFI", style: "TextSingle" }],
    [TraitDefinitionModel.Class, { description: "Class", style: "TextSingle" }],
    [TraitDefinitionModel.ClosePrice, { description: "Close Price", style: "NumericRange" }],
    [TraitDefinitionModel.Code, { description: "Code", style: "Text" }],
    [TraitDefinitionModel.ContractSize, { description: "Contract Size", style: "NumericRange" }],
    [TraitDefinitionModel.Currency, { description: "Currency", style: "TextMultiple" }],
    [TraitDefinitionModel.Data, { description: "Data", style: "TextSingle" }],
    [TraitDefinitionModel.Date, { description: "Date", style: "DateNamedRange" }],
    [TraitDefinitionModel.ExerciseType, { description: "Exercise Type", style: "TextSingleExists" }],
    [TraitDefinitionModel.Exchange, { description: "Exchange", style: "TextMultiple" }],
    [TraitDefinitionModel.ExpiryDate, { description: "Expiry Date", style: "DateRange" }],
    [TraitDefinitionModel.HighPrice, { description: "High Price", style: "NumericRange" }],
    [TraitDefinitionModel.IsIndex, { description: "Is Index", style: "BooleanSingleDefault" }],
    [TraitDefinitionModel.Leg, { description: "Leg", style: "TextSingle" }],
    [TraitDefinitionModel.LastPrice, { description: "Last Price", style: "NumericRange" }],
    [TraitDefinitionModel.LotSize, { description: "Lot Size", style: "NumericRange" }],
    [TraitDefinitionModel.LowPrice, { description: "Low Price", style: "NumericRange" }],
    [TraitDefinitionModel.Market, { description: "Market", style: "TextMultiple" }],
    [TraitDefinitionModel.Name, { description: "Name", style: "Text" }],
    [TraitDefinitionModel.Price, { description: "Named Price", style: "NumericNamedRange" }],
    [TraitDefinitionModel.OpenInterest, { description: "Open Interest", style: "NumericRange" }],
    [TraitDefinitionModel.OpenPrice, { description: "Open Price", style: "NumericRange" }],
    [TraitDefinitionModel.PreviousClose, { description: "Previous Close", style: "NumericRange" }],
    [TraitDefinitionModel.QuotationBasis, { description: "Quotation Basis", style: "TextMultiple" }],
    [TraitDefinitionModel.ShareIssue, { description: "Shares Issue", style: "NumericRange" }],
    [TraitDefinitionModel.State, { description: "State", style: "TextMultiple" }],
    [TraitDefinitionModel.StateAllows, { description: "State Allows", style: "TextSingle" }],
    [TraitDefinitionModel.StatusNote, { description: "Status Note", style: "TextMultiple" }],
    [TraitDefinitionModel.StrikePrice, { description: "Strike Price", style: "NumericRange" }],
    [TraitDefinitionModel.Trades, { description: "Trade Count", style: "NumericRange" }],
    [TraitDefinitionModel.TradingMarket, { description: "Trading Market", style: "TextMultiple" }],
    [TraitDefinitionModel.ValueTraded, { description: "Value Traded", style: "NumericRange" }],
    [TraitDefinitionModel.Volume, { description: "Volume", style: "NumericRange" }],
    [TraitDefinitionModel.VWAP, { description: "VWAP", style: "NumericRange" }],
  ]);

  public static listOfKeys(): string[] {
    return [...this.lookup.keys()];
  }

  public static description(key: string): string {
    const traitInformation = this.lookup.get(key);
    return traitInformation === undefined ? '' : traitInformation.description;
  }

  public static style(key: string): TraitStyle {
    const traitInformation = this.lookup.get(key);
    return traitInformation === undefined ? undefined : traitInformation.style;
  }
}

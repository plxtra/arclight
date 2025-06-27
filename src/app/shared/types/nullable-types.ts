import { Integer, SourceTzOffsetDate, SourceTzOffsetDateTime } from "@pbkware/js-utils";
import { AllOrdersDataItem, CurrencyId, DataIvemId, Exchange, ExchangeEnvironment, IvemId, Market, MovementId, OrderRequestDataItem, SecurityDataItem, SymbolsDataItem } from "@plxtra/motif-core";
import { Decimal } from "decimal.js-light";
import { Subscription } from "rxjs";
import { ThrottledChangeDetector } from "./throttled-change-detector";

// general
export type zstring = string | undefined;
export type znumber = number | undefined;
export type zboolean = boolean | undefined;
export type zDecimal = Decimal | undefined;
export type zInteger = Integer | undefined;

// motif core
export type zSourceTzOffsetDateTime = SourceTzOffsetDateTime | undefined;
export type zSourceTzOffsetDate = SourceTzOffsetDate | undefined;
export type zExchange = Exchange | undefined;
export type zExchangeEnvironment = ExchangeEnvironment | undefined;
export type zCurrencyId = CurrencyId | undefined;
export type zMarket = Market | undefined;
export type zMovementId = MovementId | undefined;
export type zIvemId = IvemId | undefined;
export type zDataIvemId = DataIvemId | undefined;
export type zAllOrdersDataItem = AllOrdersDataItem | undefined;
export type zSymbolsDataItem = SymbolsDataItem | undefined;
export type zSecurityDataItem = SecurityDataItem | undefined;
export type zOrderRequestDataItem = OrderRequestDataItem | undefined;

// site
export type zSubscription = Subscription | undefined;
export type zThrottledChangeDetector = ThrottledChangeDetector | undefined;

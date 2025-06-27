import { Exchange } from "@plxtra/motif-core";
import { zstring } from "../../types/nullable-types";

export class ExchangeViewModel {
  public name: zstring;
  public code: zstring;
  public display: zstring;
  public combined: zstring;

  public static newFromExchange(exchange: Exchange): ExchangeViewModel {
    const model = new ExchangeViewModel();
    model.loadFromExchange(exchange);
    return model;
  }

  public loadFromExchange(exchange: Exchange) {
    this.code = exchange.symbologyCode;
    this.display = exchange.fullDisplay;
    this.combined = `${this.code} - ${this.display}`;
    this.name = exchange.zenithCode; // Maybe want abbreviated display here
  }
}

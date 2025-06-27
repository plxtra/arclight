import { Decimal } from "decimal.js-light";
import { zDecimal, zstring } from "./nullable-types";

export namespace DecimalCreate {
  export function newZDecimal(d: zstring): zDecimal {
    if (d === undefined) return undefined;
    if (d === "") return new Decimal(0);
    return new Decimal(d);
  }
  export function newDecimal(d: string): Decimal {
    if (d === "") return new Decimal(0);
    return new Decimal(d);
  }
}

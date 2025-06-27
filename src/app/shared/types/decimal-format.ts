import { Decimal } from "decimal.js-light";
import { zDecimal } from "./nullable-types";

export namespace DecimalFormat {
  export function formatMoney(d: zDecimal): string {
    if (d === undefined) return "";
    const num = d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
    return num.toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  export function formatPrice(d: zDecimal): string {
    if (d === undefined) return "";
    const num = d.toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber();
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  }
}

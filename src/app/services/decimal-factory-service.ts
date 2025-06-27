import { Injectable } from '@angular/core';
import { DecimalConstructor, DecimalFactory } from '@pbkware/js-utils';
import { Config, Decimal, Numeric } from 'decimal.js-light';

@Injectable({
  providedIn: 'root'
})
export class DecimalFactoryService implements DecimalFactory {
    readonly nullDecimal: Decimal;

    constructor() {
        this.nullDecimal = new Decimal(-999999999999999.9);
    }

    newDecimal(value: Numeric): Decimal {
        return new Decimal(value);
    }
    newUndefinableDecimal(value: Numeric | undefined): Decimal | undefined {
        return value === undefined ? undefined : new Decimal(value);
    }

    newUndefinableNullableDecimal(value: Numeric | undefined | null): Decimal | null | undefined {
        if (value === null) {
            return null;
        } else {
            return this.newUndefinableDecimal(value);
        }
    }

    cloneDecimal(config: Config): DecimalConstructor {
        return Decimal.clone(config);
    }
}

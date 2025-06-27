import { BrokerageAccount, Currency } from '@plxtra/motif-core';
import { BundledService } from "src/app/services/bundled.service";
import { zstring } from "../../types/nullable-types";
import { BaseViewModel } from "./base.viewmodel";

export class AccountViewModel extends BaseViewModel {
  public key: zstring;
  public zenithCode: string;
  public display: zstring;
  public name: zstring;
  public environment: zstring;
  public currency: zstring;
  public usable = false;

  static newFromDI(acct: BrokerageAccount, bundledSvc: BundledService): AccountViewModel {
    const model = new AccountViewModel(bundledSvc);
    model.loadFromDI(acct);
    return model;
  }

  loadFromDI(acct: BrokerageAccount | undefined): void {
    if (acct) {
      this.key = acct.mapKey;
      this.zenithCode = acct.zenithCode;
      this.display = acct.id.display;
      this.name = acct.name;
      this.environment = acct.id.environment.display;
      const currencyId = acct.currencyId;
      this.currency = currencyId === undefined ? undefined : Currency.idToDisplay(currencyId);
      // meta
      this.usable = acct.usable;
    }
  }
}

export namespace AccountViewModel {
  export interface Skeleton {
    readonly key: zstring;
    readonly zenithCode: zstring;
    readonly display: zstring;
    readonly name: zstring;
    readonly environment: zstring;
    readonly currency: zstring;
    readonly usable: boolean | undefined;
  }
}

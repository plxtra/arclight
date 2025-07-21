import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { BrokerageAccountsDataDefinition, BrokerageAccountsDataItem } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { AccountSearchTransferModel } from '../../models/transfer/account-search.transfermodel';
import { AccountViewModel } from '../../models/view/account.viewmodel';

@Component({
  selector: 'app-account-search',
  templateUrl: './account-search.page.html',
  styleUrls: ['./account-search.page.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonicModule
  ],
})
export class AccountSearchPageComponent implements OnInit, OnDestroy {
  public dataAvailable: boolean;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private _modalController: ModalController;

  private _tradingAccountsDI: BrokerageAccountsDataItem | undefined;
  private _viewData: AccountViewModel[] = [];
  private _filteredViewData: AccountViewModel[] = [];

  private _subidEndChanges: MultiEvent.SubscriptionId;

  private _searchText = "";

  constructor() {
    const modalController = inject(ModalController);
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._modalController = modalController;
    this.dataAvailable = false;

    addIcons({
      close,
    });
  }

  public get accountList() {
    if (this.dataAvailable) {
      if (this._searchText.length > 0) {
        return this._filteredViewData;
      } else {
        return this._viewData;
      }
    } else {
      return undefined;
    }
  }

  public get searchText(): string {
    return this._searchText;
  }
  public set searchText(v: string) {
    if (this._searchText !== v) {
      this._searchText = v;
      this._filteredViewData = this._viewData.filter((avm) =>
        avm.display?.toLowerCase().includes(this._searchText.toLowerCase())
        || avm.name?.toLowerCase().includes(this._searchText.toLowerCase()));
    }
  }

  ngOnInit() {
    this.subscribeToTradingAccounts();
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromTradingAccounts();
  }

  dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPDM55592');
  }

  selectAccount(accountZenithCode: string) {
    const modalData = {
      accountZenithCode
    } as AccountSearchTransferModel;
    const dismissPromise = this._modalController.dismiss(modalData);
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPSA55592');
  }

  private subscribeToTradingAccounts() {
    const definition = new BrokerageAccountsDataDefinition();
    this._tradingAccountsDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountsDataItem;

    this.loadAccountData()

    this._subidEndChanges = this._tradingAccountsDI.subscribeEndChangesEvent(() => this.loadAccountData());
  }

  private loadAccountData() {
    const tradingAccountsDI = this._tradingAccountsDI;
    if (tradingAccountsDI === undefined) {
      throw new AssertInternalError('ASPLAD55592');
    } else {
      this._viewData = tradingAccountsDI.records.map(r => AccountViewModel.newFromDI(r, this._bundledSvc));
      this.dataAvailable = tradingAccountsDI.usable;
    }
  }

  private checkUnsubscribeFromTradingAccounts() {
    if (this._tradingAccountsDI !== undefined) {
      this._tradingAccountsDI.unsubscribeEndChangesEvent(this._subidEndChanges);
      this._unifySvc.adi.unsubscribe(this._tradingAccountsDI);
    }
  }
}

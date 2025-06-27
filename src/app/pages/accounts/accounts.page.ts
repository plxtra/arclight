import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { BrokerageAccountsDataDefinition, BrokerageAccountsDataItem } from '@plxtra/motif-core';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { AccountViewModel } from 'src/app/shared/models/view/account.viewmodel';
import { ListDataTemplateDirective } from 'src/app/templates/list-data.template';

import { RouterLink } from '@angular/router';
import { IonRouterLink } from '@ionic/angular/standalone';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.page.html',
  styleUrls: ['./accounts.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    ScrollingModule,
    OpenOrdersControlComponent,
    RouterLink,
    IonRouterLink
  ],
})
export class AccountsPageComponent extends ListDataTemplateDirective<AccountViewModel> implements OnInit, OnDestroy {
  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;

  private _tradingAccountsDI: BrokerageAccountsDataItem | undefined;

  private _subidEndChanges: MultiEvent.SubscriptionId;
  private _skeletonList: AccountViewModel.Skeleton[];

  constructor(
    unifySvc: UnifyService,
    bundledSvc: BundledService
  ) {
    super();
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;

    this._skeletonList = new Array<AccountViewModel.Skeleton>(5);
  }

  public get accountList() {
    // because we use Skeleton we need to wrap the underlying list property
    if (this.dataAvailable) {
      const viewData = this.viewData;
      if (viewData === null) {
        return this._skeletonList;
      } else {
        return viewData;
      }
    } else {
      return this._skeletonList;
    }
  }

  public get badgeColour(): string {
    if (this._searchText.length  > 0) {
      return "secondary";
    } else {
      return "light";
    }
  }

  ngOnInit() {
    this.subscribeToTradingAccounts();
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromTradingAccounts();
  }

  protected resolveFilterLambda(model: AccountViewModel): boolean {
    const display = model.display;
    const name = model.name;
    const displayIncludesSearchText = display !== undefined && display.toLowerCase().includes(this._searchText.toLowerCase());
    const nameIncludesSearchText = name !== undefined && name.toLowerCase().includes(this._searchText.toLowerCase());
    return displayIncludesSearchText || nameIncludesSearchText;
  }

  private subscribeToTradingAccounts() {
    const definition = new BrokerageAccountsDataDefinition();
    this._tradingAccountsDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountsDataItem;

    this.loadAccountData()

    this._subidEndChanges = this._tradingAccountsDI.subscribeEndChangesEvent(() => this.loadAccountData());
  }

  private loadAccountData() {
    if (this._tradingAccountsDI === undefined) {
      throw new AssertInternalError('APLAD60877');
    } else {
      this._viewData = this._tradingAccountsDI.records.map(r => AccountViewModel.newFromDI(r, this._bundledSvc));
      this.dataAvailable = this._tradingAccountsDI.usable;
    }
  }

  private checkUnsubscribeFromTradingAccounts() {
    if (this._tradingAccountsDI !== undefined) {
      this._tradingAccountsDI.unsubscribeEndChangesEvent(this._subidEndChanges);
      this._unifySvc.adi.unsubscribe(this._tradingAccountsDI);
      this._tradingAccountsDI = undefined;
    }
  }
}

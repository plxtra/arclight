import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MultiEvent, UsableListChangeTypeId } from '@pbkware/js-utils';
import { AllOrdersDataDefinition, AllOrdersDataItem, Order, OrderSideId } from '@plxtra/motif-core';

import { ScrollingModule } from '@angular/cdk/scrolling';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ActionSheetOptions,
  IonBadge,
  IonButtons,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonMenuButton, IonRow,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { BundledService } from 'src/app/services/bundled.service';
import { OrderGrouping } from 'src/app/services/personalisation.service';
import { UnifyService } from 'src/app/services/unify.service';
import { OrderViewModel } from 'src/app/shared/models/view/order.viewmodel';
import { zAllOrdersDataItem, zstring } from 'src/app/shared/types/nullable-types';
import { SourceTzOffsetDateTimeExt } from 'src/app/shared/types/shared-types';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    ScrollingModule,
    OpenOrdersControlComponent,
    IonHeader,
    IonContent,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonMenuButton,
    IonSpinner,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonFooter,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
  ],
})
export class OrdersPageComponent implements OnInit, OnDestroy {
  public dataAvailableOrders = false;

  public customActionSheetOptions = {
    header: 'Grouping',
    subHeader: 'Select grouping method',
    cssClass: 'standard-action-sheet'
  } as ActionSheetOptions;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;

  private _viewModelMap: Map<string, OrderViewModel>; // all OVM's keyed on OrderId
  private _viewDataMap: Map<string, OrderViewModel[]>; // Grouping on Key with a list of OVM (looked up from _viewModelMap)
  private _viewDataKeys: string[]; // sorted list of Keys
  private _filteredViewDataMap: Map<string, OrderViewModel[]>; // Filtered grouping on Key with a list of OVM's (looked up from _viewModelMap)
  private _filteredViewDataKeys: string[]; // Filtered and sorted list of Keys

  private _ordersDI: zAllOrdersDataItem;
  private _subidUsable: MultiEvent.SubscriptionId;
  private _subidOrdersListChange: MultiEvent.SubscriptionId;
  private _subidOrdersBeforeRecordChange: MultiEvent.SubscriptionId;
  private _subidOrdersAfterRecordChange: MultiEvent.SubscriptionId;
  // these events monitor for order changes
  private _subidOrderChanges: Map<string, MultiEvent.SubscriptionId>;

  private _searchText = "";
  private _orderGrouping: OrderGrouping;

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._viewModelMap = new Map<string, OrderViewModel>();
    this._orderGrouping = this._bundledSvc.personalisationService.defaultOrderGrouping;
    this._viewDataMap = new Map<string, OrderViewModel[]>();
    this._filteredViewDataMap = new Map<string, OrderViewModel[]>();
    this._viewDataKeys = [];
    this._filteredViewDataKeys = [];
    this._subidOrderChanges = new Map<string, MultiEvent.SubscriptionId>();
  }

  public get isFiltered(): boolean {
    return (this._searchText.length > 0);
  }

  public get ordersKeys() {
    if (this.isFiltered) return this._filteredViewDataKeys;
    return this._viewDataKeys;
  }

  public get searchText(): string {
    return this._searchText;
  }
  public set searchText(v: string) {
    if (this._searchText !== v) {
      this._searchText = v;
      // apply filter here. Also need to reapply when new order is recieved, or when grouping changed
      this.applyFilter();
    }
  }

  public get orderGrouping(): OrderGrouping {
    return this._orderGrouping;
  }
  public set orderGrouping(v: OrderGrouping) {
    if (this._orderGrouping !== v) {
      this._orderGrouping = v;
      this.applyGrouping();
    }
  }

  ngOnInit() {
    this.subscribeOrders();
  }

  ngOnDestroy() {
    this.checkUnsubscribeOrders();
  }

  public orderColour(sideId: OrderSideId): string {
    switch (sideId) {
      case OrderSideId.Ask: return "danger";
      case OrderSideId.Bid: return "success";
      default: return "primary";
    }
  }

  public ordersMap(key: string) {
    if (this.isFiltered) return this._filteredViewDataMap.get(key);
    return this._viewDataMap.get(key);
  }

  public unfilteredOrdersMap(key: string) {
    return this._viewDataMap.get(key);
  }

  public groupHeading(key: string): string {
    switch (this._orderGrouping) {
      case 'onAccount': {
        const acctName = this._bundledSvc.brokerageAccountsService.findAccount(key)?.name;
        return `${key} - ${acctName}`;
      }
      case 'onStatus':
      case 'onSymbol':
        return key;
      case 'onUpdate':
      case 'onCreate':
        return new Date(key).toLocaleDateString();
    }
  }

  private subscribeOrders() {
    this.dataAvailableOrders = false;
    this.checkUnsubscribeOrders();

    const definition = new AllOrdersDataDefinition();
    const ordersDI = this._unifySvc.adi.subscribe(definition) as AllOrdersDataItem;
    this._ordersDI = ordersDI;
    this.reloadAllOrderValues();
    this._subidOrdersListChange = ordersDI.subscribeListChangeEvent((chgType, idx, num) => {
      switch (chgType) {
        case UsableListChangeTypeId.Usable:
          for (let i = 0; i < ordersDI.records.length; i++) {
            const rec = ordersDI.records[i];
            this.tryAddOrder(rec);
          }
          break;
        case UsableListChangeTypeId.Clear:
        case UsableListChangeTypeId.PreUsableClear:
        case UsableListChangeTypeId.Unusable:
          ordersDI.records.forEach((odr) => this.tryRemoveOrder(odr));
          this._viewModelMap.clear();
          break;
        case UsableListChangeTypeId.Insert:
          for (let i = 0; i < num; i++) {
            const rec = ordersDI.records[idx + i];
            this.tryAddOrder(rec);
          }
          break;
        case UsableListChangeTypeId.Remove:
          for (let i = 0; i < num; i++) {
            const rec = ordersDI.records[idx + i];
            this.tryRemoveOrder(rec);
          }
          break;
        default:
          break;
      }
    });
    this._subidOrdersBeforeRecordChange = ordersDI.subscribeBeforeRecordChangeEvent((idx) => {
      const rec = ordersDI.records[idx];
      this.tryRemoveOrder(rec);
    });
    this._subidOrdersAfterRecordChange = ordersDI.subscribeAfterRecordChangedEvent((idx) => {
      const rec = ordersDI.records[idx];
      this.tryAddOrder(rec);
    });
    this._subidUsable = ordersDI.subscribeCorrectnessChangedEvent(() => this.loadIsUsable(ordersDI));
    this.loadIsUsable(ordersDI);
  }

  private checkUnsubscribeOrders() {
    if (this._ordersDI !== undefined) {
      this._ordersDI.records.forEach((odr) => this.tryRemoveOrder(odr));
      this._ordersDI.unsubscribeListChangeEvent(this._subidOrdersListChange);
      this._ordersDI.unsubscribeBeforeRecordChangeEvent(this._subidOrdersBeforeRecordChange);
      this._ordersDI.unsubscribeAfterRecordChangedEvent(this._subidOrdersAfterRecordChange);
      this._ordersDI.unsubscribeCorrectnessChangedEvent(this._subidUsable);
      this._unifySvc.adi.unsubscribe(this._ordersDI);
      this._ordersDI = undefined;
    }
  }

  private loadIsUsable(ordersDI: AllOrdersDataItem) {
    this.dataAvailableOrders = ordersDI.usable;
  }

  private reloadAllOrderValues() {
    this._viewModelMap.clear();
    this._viewDataMap.clear();
    this._viewDataKeys = [];

    if (this._ordersDI === undefined)
      return;
    this._ordersDI.records.map((odr) => this.tryAddOrder(odr));
    this.applyGrouping();
  }

  private tryAddOrder(rec: Order) {
    if (!this._viewModelMap.has(rec.id)) {
      this._viewModelMap.set(rec.id, OrderViewModel.newFromDI(rec, this._bundledSvc, undefined));
      if (!this._subidOrderChanges.has(rec.id)) {
        window.arclightLogger.logDebug(`ORD: Add ${rec.id}`);
        const subid = rec.subscribeChangedEvent((changes) => this.tryChangeOrder(rec, changes));
        this._subidOrderChanges.set(rec.id, subid);
      }
      this.applyGrouping();
    }
  }

  private tryRemoveOrder(rec: Order) {
    if (this._subidOrderChanges.has(rec.id)) {
      rec.unsubscribeChangedEvent(this._subidOrderChanges.get(rec.id))
      this._subidOrderChanges.delete(rec.id);
    }
    if (this._viewModelMap.has(rec.id)) {
      window.arclightLogger.logDebug(`ORD: Remove ${rec.id}`);
      this._viewModelMap.delete(rec.id);
      this.applyGrouping();
    }
  }

  private tryChangeOrder(rec: Order, changes: Order.ValueChange[]) {
    if (this._viewModelMap.has(rec.id)) {
      window.arclightLogger.logDebug(`ORD: Change ${rec.id}`);
      const ovm = this._viewModelMap.get(rec.id);
      if (ovm === undefined)
        return;
      ovm.loadFromDI(rec);
      ovm.loadChanges(changes);
      this.applyGrouping();
    }
  }

  private applyGrouping() {
    this._viewDataKeys = [];
    this._viewDataMap.clear();

    this._viewModelMap
      .forEach((ovm) => {
        const key = this.getGroupingKey(ovm);
        if (!this._viewDataMap.has(key)) {
          this._viewDataMap.set(key, []);
          const insertIdx = this.getKeyInsertIndex(this._viewDataKeys, key);
          this._viewDataKeys.splice(insertIdx, 0, key);
        }
        const insertIdx = this.getGroupInsertIndex(this._viewDataMap.get(key), ovm);
        this._viewDataMap.get(key)?.splice(insertIdx, 0, ovm);
      });
    this.applyFilter();
  }

  private applyFilter() {
    this._filteredViewDataKeys = [];
    this._filteredViewDataMap.clear();

    if (this.isFiltered) {
      const lower = this._searchText.toLowerCase();
      const tempDataMap = new Map<string, OrderViewModel[]>();
      const tempDataKeys: string[] = [];

      for (const ovmArray of this._viewDataMap.values()) {
        ovmArray
          .filter((ovm) => {
            return (ovm.accountIdDisplay?.toLowerCase().includes(lower)
              || ovm.accountName?.toLowerCase().includes(lower)
              || ovm.code?.toLowerCase().includes(lower)
              || ovm.name?.toLowerCase().includes(lower)
              || ovm.status?.toLowerCase().includes(lower)
              || ovm.side?.toLowerCase().includes(lower)
              || ovm.placedPrice?.toString().includes(lower)
              || ovm.placedQuantity?.toString().includes(lower)
              || ovm.tradedQuantity?.toString().includes(lower)
              || ovm.untradedQuantity?.toString().includes(lower)
              || ovm.orderId?.toLowerCase().includes(lower)
              || ovm.createdDisplay?.toLowerCase().includes(lower)
              || ovm.updatedDisplay?.toLowerCase().includes(lower));
          })
          .forEach((ovm) => {
            const key = this.getGroupingKey(ovm);
            if (!tempDataMap.has(key)) {
              tempDataMap.set(key, []);
              const insertIdx = this.getKeyInsertIndex(tempDataKeys, key);
              tempDataKeys.splice(insertIdx, 0, key);
            }
            const insertIdx = this.getGroupInsertIndex(tempDataMap.get(key), ovm);
            tempDataMap.get(key)?.splice(insertIdx, 0, ovm);
          });
      }

      this._filteredViewDataMap = tempDataMap;
      this._filteredViewDataKeys = tempDataKeys;
    }
  }

  private getGroupingKey(odr: OrderViewModel): string {
    let key: zstring = undefined;
    switch (this._orderGrouping) {
      case 'onAccount':
        key = odr.accountIdDisplay;
        break;
      case 'onCreate':
        if (odr.created !== undefined) {
          const dtCreate = SourceTzOffsetDateTimeExt.getAdjustedDate(odr.created, this._bundledSvc.personalisationService.displayTimeZoneToModeId());
          key = dtCreate.toISOString().split('T')[0];
        }
        break;
      case 'onStatus':
        key = odr.status;
        break;
      case 'onSymbol':
        key = odr.code;
        break;
      case 'onUpdate':
        if (odr.updated !== undefined) {
          const dtUpdate = SourceTzOffsetDateTimeExt.getAdjustedDate(odr.updated, this._bundledSvc.personalisationService.displayTimeZoneToModeId());
          key = dtUpdate.toISOString().split('T')[0];
        }
        break;
    }
    return key ?? "";
  }

  private sortByOrderViewModel(a: OrderViewModel, b: OrderViewModel): number {
    switch (this._orderGrouping) {
      case 'onAccount':
      case 'onStatus':
      case 'onSymbol':
      case 'onUpdate':
        // newest update first
        if (a.updated !== undefined && b.updated !== undefined) {
          if (a.updated.utcDate > b.updated.utcDate) return 1;
          else if (a.updated.utcDate < b.updated.utcDate) return -1;
        }
        return 0;
      case 'onCreate':
        // newest create first
        if (a.created !== undefined && b.created !== undefined) {
          if (a.created.utcDate > b.created.utcDate) return 1;
          else if (a.created.utcDate < b.created.utcDate) return -1;
        }
        return 0;
    }
  }

  private sortByKey(a: string, b: string): number {
    switch (this._orderGrouping) {
      case 'onAccount':
      case 'onSymbol':
      case 'onStatus':
        // alphabetical (for now)
        if (a < b) return 1;
        else if (a > b) return -1
        return 0;
      case 'onUpdate':
      case 'onCreate':
        // newest update first
        if (a > b) return 1;
        else if (a < b) return -1
        return 0;
    }
  }

  private getGroupInsertIndex(array: OrderViewModel[] | undefined, element: OrderViewModel): number {
    if (array === undefined)
      return 0;
    let insertIdx = 0;
    for (let i = 0; i < array.length; i++) {
      if (this.sortByOrderViewModel(element, array[i]) > 0) {
        insertIdx = i;
        break;
      }
    }
    return insertIdx;
  }

  private getKeyInsertIndex(array: string[], element: string): number {
    let insertIdx = 0;
    for (let i = 0; i < array.length; i++) {
      if (this.sortByKey(element, array[i]) > 0) {
        insertIdx = i;
        break;
      }
      insertIdx = i + 1;
    }
    return insertIdx;
  }
}

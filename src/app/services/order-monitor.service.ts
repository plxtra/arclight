import { Injectable, OnDestroy } from "@angular/core";
import { MultiEvent, UsableListChangeTypeId } from "@pbkware/js-utils";
import { AllOrdersDataDefinition, AllOrdersDataItem, Order, OrderStatus } from "@plxtra/motif-core";

import { OrderViewModel } from "../shared/models/view/order.viewmodel";
import { zAllOrdersDataItem } from "../shared/types/nullable-types";
import { UnscaledChangeAutoReset } from "../shared/types/unscaled-change-autoreset";
import { BundledService } from "./bundled.service";
import { OpenIdService } from './open-id-service';
import { UnifyService } from "./unify.service";

@Injectable({
  providedIn: 'root'
})
export class OrderMonitorService implements OnDestroy {
  private readonly _unifyService: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _openIdService: OpenIdService;

  private _subidLoadUser: MultiEvent.SubscriptionId;

  private _ordersDI: zAllOrdersDataItem;
  // these events are used to determine the current list of orders. To detect changes we must subscribe the the individual order change event.
  private _subidOrdersListChange: MultiEvent.SubscriptionId;
  private _subidOrdersBeforeRecordChange: MultiEvent.SubscriptionId;
  private _subidOrdersAfterRecordChange: MultiEvent.SubscriptionId;
  // these events monitor for order changes
  private _subidOrderChanges: Map<string, MultiEvent.SubscriptionId>;

  private _openOrderIds: Map<string, OrderViewModel>; //https://livecodestream.dev/post/everything-you-should-know-about-javascript-dictionaries
  private _openOrdersAutoReset: UnscaledChangeAutoReset;

  constructor(
    unifyService: UnifyService,
    bundledSvc: BundledService,
    openIdService: OpenIdService,
  ) {
    this._unifyService = unifyService;
    this._bundledSvc = bundledSvc;
    this._openIdService = openIdService;

    this._subidOrderChanges = new Map<string, MultiEvent.SubscriptionId>();

    this._openOrderIds = new Map<string, OrderViewModel>();
    this._openOrdersAutoReset = new UnscaledChangeAutoReset(undefined, this._bundledSvc.personalisationService.highlightTime);

    if (this._openIdService.isLoggedIn())
      this.subscribeAllOrders(this._openIdService.userID);

    this._subidLoadUser = this._openIdService.subscribeUserLoadedEvent((userId) => {
      this.subscribeAllOrders(userId);
    });
  }

  public get openOrdersChanged(): boolean { return this._openOrdersAutoReset.Changed; }

  public get openOrdersExist(): boolean {
    return (this._openOrderIds.size > 0);
  }

  public get openOrdersList(): OrderViewModel[] {
    const lst: OrderViewModel[] = [...this._openOrderIds.values()];
    // for (const value of this._openOrderIds.values()) {
    //   lst.push(value);
    // }
    return lst;
  }

  ngOnDestroy(): void {
    this.checkUnsubscribeAllOrders();
    this._openIdService.unsubscribeUserLoadedEvent(this._subidLoadUser);
    this._subidLoadUser = undefined;
  }

  private subscribeAllOrders(userId: string) {
    window.arclightLogger.logDebug(`ORD-MON: Subscribe ${ userId}`);

    this.checkUnsubscribeAllOrders();
    this._openOrderIds.clear();

    const definition = new AllOrdersDataDefinition();
    this._ordersDI = this._unifyService.adi.subscribe(definition) as AllOrdersDataItem;
    this.loadAllOrderValues();
    this._subidOrdersListChange = this._ordersDI.subscribeListChangeEvent((chgType, idx, num) => {
      if (this._ordersDI === undefined) return;
      switch (chgType) {
        case UsableListChangeTypeId.Usable:
          this.loadAllOrderValues();
          break;
        case UsableListChangeTypeId.Clear:
          this._ordersDI.records.forEach((odr) => this.tryRemoveOpenOrder(odr));
          this._openOrderIds.clear();
          this._openOrdersAutoReset.markAsChanged();
          break;
        case UsableListChangeTypeId.PreUsableClear:
        case UsableListChangeTypeId.Unusable:
          this._ordersDI.records.forEach((odr) => this.tryRemoveOpenOrder(odr));
          this._openOrderIds.clear();
          break;
        case UsableListChangeTypeId.Insert:
          for (let i = 0; i < num; i++) {
            const rec = this._ordersDI.records[idx + i];
            this.tryAddOpenOrder(rec);
          }
          break;
        case UsableListChangeTypeId.Remove:
          for (let i = 0; i < num; i++) {
            const rec = this._ordersDI.records[idx + i];
            this.tryRemoveOpenOrder(rec);
          }
          break;
      }
    });

    this._subidOrdersBeforeRecordChange = this._ordersDI.subscribeBeforeRecordChangeEvent((idx) => {
      if (this._ordersDI === undefined) return;
      const rec = this._ordersDI.records[idx];
      this.tryRemoveOpenOrder(rec);
    });

    this._subidOrdersAfterRecordChange = this._ordersDI.subscribeAfterRecordChangedEvent((idx) => {
      if (this._ordersDI === undefined) return;
      const rec = this._ordersDI.records[idx];
      this.tryAddOpenOrder(rec);
    });
  }

  private orderNotCompleted(order: Order): boolean {
    return !order.statusReasonIds.some((s) => s === OrderStatus.ReasonId.Completed)
  }

  private tryAddOpenOrder(rec: Order) {
    if (this.orderNotCompleted(rec)) {
      if (!this._openOrderIds.has(rec.id)) {
        window.arclightLogger.logDebug(`ORD-MON: Adding ${ rec.id}`);
        this._openOrderIds.set(rec.id, OrderViewModel.newFromDI(rec, this._bundledSvc, undefined));
        if (!this._subidOrderChanges.has(rec.id)) {
          const subid = rec.subscribeChangedEvent((changes) => this.tryChangeOrder(rec, changes));
          this._subidOrderChanges.set(rec.id, subid);
        }
        this._openOrdersAutoReset.markAsChanged();
      }
    }
  }

  private tryRemoveOpenOrder(rec: Order) {
    if (this._subidOrderChanges.has(rec.id)) {
      rec.unsubscribeChangedEvent(this._subidOrderChanges.get(rec.id));
      this._subidOrderChanges.delete(rec.id);
    }
    if (this._openOrderIds.has(rec.id)) {
      window.arclightLogger.logDebug(`ORD-MON: Removing ${ rec.id}`);
      this._openOrderIds.delete(rec.id);
      this._openOrdersAutoReset.markAsChanged();
    }
  }

  private tryChangeOrder(rec: Order, changes: Order.ValueChange[]) {
    if (this._openOrderIds.has(rec.id)) {
      window.arclightLogger.logDebug(`ORD-MON: Changing ${ rec.id}`);
      const ovm = this._openOrderIds.get(rec.id);
      ovm?.loadFromDI(rec);
      ovm?.loadChanges(changes);
      this._openOrdersAutoReset.markAsChanged();
    }
  }

  private checkUnsubscribeAllOrders() {
    if (this._ordersDI !== undefined) {
      this._ordersDI.records.forEach((odr) => this.tryRemoveOpenOrder(odr));
      this._ordersDI.unsubscribeListChangeEvent(this._subidOrdersListChange);
      this._ordersDI.unsubscribeBeforeRecordChangeEvent(this._subidOrdersBeforeRecordChange);
      this._ordersDI.unsubscribeAfterRecordChangedEvent(this._subidOrdersAfterRecordChange);
      this._unifyService.adi.unsubscribe(this._ordersDI);
      this._ordersDI = undefined;
    }
  }

  private loadAllOrderValues() {
    window.arclightLogger.logDebug('ORD-MON: Load');
    this._ordersDI?.records.forEach((r) => this.tryAddOpenOrder(r));
  }
}

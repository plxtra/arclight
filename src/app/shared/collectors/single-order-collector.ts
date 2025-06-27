import { EventEmitter, Injectable, OnDestroy, Output } from "@angular/core";
import { AssertInternalError, MultiEvent, UsableListChangeTypeId } from "@pbkware/js-utils";
import { BrokerageAccountOrdersDataDefinition, BrokerageAccountOrdersDataItem, Order } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { UnifyService } from "src/app/services/unify.service";
import { OrderViewModel } from "src/app/shared/models/view/order.viewmodel";

@Injectable({
  providedIn: "root"
})
export class SingleOrderCollector implements OnDestroy {
  @Output()
  public sourceOrderChangeEventEmitter = new EventEmitter();

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;

  private _accountZenithCode: string;
  private _orderId: string;
  private _sourceOrder: Order | undefined;
  private _viewData: OrderViewModel | undefined;

  private _ordersDI: BrokerageAccountOrdersDataItem | undefined;
  private _subidAccountOrdersListChange: MultiEvent.SubscriptionId;
  private _subidAccountOrdersBeforeRecordChange: MultiEvent.SubscriptionId;
  private _subidAccountOrdersAfterRecordChange: MultiEvent.SubscriptionId;
  private _subidOrderChanged: MultiEvent.SubscriptionId;

  constructor(unifySvc: UnifyService, bundledSvc: BundledService) {
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
  }

  public get orderView(): OrderViewModel | undefined { return this._viewData; }
  public get sourceOrder(): Order | undefined { return this._sourceOrder; }

  ngOnDestroy() {
    this.checkUnsubscribeFromOrder();
  }

  public subscribeToOrder(accountZenithCode: string, orderId: string) {
    this.checkUnsubscribeFromOrder();
    this._accountZenithCode = accountZenithCode;
    this._orderId = orderId;

    const definition = new BrokerageAccountOrdersDataDefinition(this._accountZenithCode);
    this._ordersDI = this._unifySvc.adi.subscribe(definition) as BrokerageAccountOrdersDataItem;
    const ordersDI = this._ordersDI;
    this.loadValue();

    this._subidAccountOrdersListChange = ordersDI.subscribeListChangeEvent((chgType, idx, num) => {
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
      }
    });

    this._subidAccountOrdersBeforeRecordChange = ordersDI.subscribeBeforeRecordChangeEvent((idx) => {
      const rec = ordersDI.records[idx];
      this.tryRemoveOrder(rec);
    });

    this._subidAccountOrdersAfterRecordChange = ordersDI.subscribeAfterRecordChangedEvent((idx) => {
      const rec = ordersDI.records[idx];
      this.tryAddOrder(rec);
    });
  }

  private fireOnSourceOrderChange() { this.sourceOrderChangeEventEmitter.emit(); }

  private loadValue() {
    const ordersDI = this._ordersDI;
    if (ordersDI === undefined) {
      throw new AssertInternalError('SOCLV22177');
    } else {
      const idx = ordersDI.records.findIndex((rec) => this.isTargetOrder(rec));
      if (idx !== -1) {
        this.tryAddOrder(ordersDI.records[idx]);
      } else {
        this.tryRemoveOrder(ordersDI.records[idx]);
      }
    }
  }

  private tryAddOrder(order: Order | undefined) {
    if (order) {
      this.tryRemoveOrder(order);
      if (this.isTargetOrder(order)) {
        this._sourceOrder = order;
        this._viewData = OrderViewModel.newFromDI(order, this._bundledSvc, undefined);
        this._subidOrderChanged = order.subscribeChangedEvent((changes) => this.tryChangeOrder(order, changes));
        this.fireOnSourceOrderChange();
      }
    }
  }

  private tryRemoveOrder(order: Order | undefined) {
    if (this.isTargetOrder(order)) {
      if (this._sourceOrder !== undefined) {
        this._sourceOrder.unsubscribeChangedEvent(this._subidOrderChanged);
        this._sourceOrder = undefined;
        this._viewData = undefined;
      }
    }
  }

  private tryChangeOrder(order: Order, changes: Order.ValueChange[]) {
    const viewData = this._viewData;
    if (viewData === undefined) {
      throw new AssertInternalError('AOPTCO50112', order.id);
    } else {
      viewData.loadFromDI(order);
      viewData.loadChanges(changes);
    }
  }

  private isTargetOrder(order: Order | undefined): boolean {
    if (order === undefined) {
      return false;
    } else {
      const orderIdMatch = this._orderId.toLowerCase();
      return (order.id.toLowerCase() === orderIdMatch);
    }
  }

  private checkUnsubscribeFromOrder() {
    this.tryRemoveOrder(this._sourceOrder);
    if (this._ordersDI !== undefined) {
      this._ordersDI.unsubscribeListChangeEvent(this._subidAccountOrdersListChange);
      this._ordersDI.unsubscribeBeforeRecordChangeEvent(this._subidAccountOrdersBeforeRecordChange);
      this._ordersDI.unsubscribeAfterRecordChangedEvent(this._subidAccountOrdersAfterRecordChange);
      this._unifySvc.adi.unsubscribe(this._ordersDI);
      this._ordersDI = undefined;
    }
  }
}

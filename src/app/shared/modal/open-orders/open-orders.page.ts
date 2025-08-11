import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AccordionGroupCustomEvent,
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { OrderMonitorService } from 'src/app/services/order-monitor.service';
import { AmendOrderPlacementTransferModel } from '../../models/transfer/amend-order-placement.transfermodel';
import { CancelOrderPlacementTransferModel } from '../../models/transfer/cancel-order-placement.transfermodel';
import { OrderViewModel } from '../../models/view/order.viewmodel';
import { zstring } from '../../types/nullable-types';
import { AmendOrderPageComponent } from '../order-pad/amend-order/amend-order.page';
import { CancelOrderPageComponent } from '../order-pad/cancel-order/cancel-order.page';

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.page.html',
  styleUrls: ['./open-orders.page.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonContent,
    IonList,
    IonLabel,
    IonItem,
    IonRow,
    IonCol,
    IonIcon,
    IonToolbar,
    IonButton,
    IonButtons,
    IonHeader,
    IonTitle,
    IonCard,
    IonAccordion,
    IonAccordionGroup,
    IonGrid,
  ],
})
export class OpenOrdersPageComponent {
  private readonly _modalController: ModalController;
  private readonly _orderMonitorService: OrderMonitorService;

  private _selectedOrderId: zstring;
  private _selectedAccountId: zstring;

  constructor() {
    const modalController = inject(ModalController);
    const orderMonitorSvc = inject(OrderMonitorService);

    this._orderMonitorService = orderMonitorSvc;
    this._modalController = modalController;

    addIcons({
      close,
    });
  }

  public get openOrders(): OrderViewModel[] {
    return this._orderMonitorService.openOrdersList;
  }

  dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'OOPDM88433');
  }

  public selectOrderId(evnt: Event | undefined) {
    if (evnt !== undefined) {
      const ev = evnt as AccordionGroupCustomEvent<string>;
      const details = this._orderMonitorService.openOrdersList.find(ord => ord.orderId === ev.detail.value);
      if (details !== undefined) {
        this._selectedOrderId = details.orderId;
        this._selectedAccountId = details.accountIdDisplay;
      }
    }
  }

  public async modifySelectedOrder() {
    if (this._selectedOrderId) {
      window.arclightLogger.logDebug(`Amend order ${ this._selectedOrderId}`);

      const props = {
        accountZenithCode: this._selectedAccountId,
        orderId: this._selectedOrderId
      } as AmendOrderPlacementTransferModel;

      const modal = await this._modalController.create({
        component: AmendOrderPageComponent,
        componentProps: { primer: props },
        cssClass: 'amend-order-modal',
        backdropDismiss: false
      });

      const dismissPromise = modal.onDidDismiss();
      dismissPromise.then(
        (modalResult) => {
          if (modalResult.data) { // not cancelled
            // const data = modalResult.data;
            // toast?
          }
        },
        (reason: unknown) => { AssertInternalError.createIfNotError(reason, 'OOPMSO88434'); }
      );

      await modal.present();
    }
  }

  public async cancelSelectedOrder() {
    if (this._selectedOrderId) {
      window.arclightLogger.logDebug(`Cancel order ${ this._selectedOrderId}`);
      const props = {
        accountZenithCode: this._selectedAccountId,
        orderId: this._selectedOrderId
      } as CancelOrderPlacementTransferModel;

      const modal = await this._modalController.create({
        component: CancelOrderPageComponent,
        componentProps: { primer: props },
        cssClass: 'cancel-order-modal',
        backdropDismiss: false
      });

      const dismissPromise = modal.onDidDismiss();
      dismissPromise.then(
        (modalResult) => {
          if (!modalResult.data) { // not cancelled
            // const data = modalResult.data;
            // toast?
          }
        },
        (reason: unknown) => { AssertInternalError.createIfNotError(reason, 'OOPCSO88434'); }
      );

      await modal.present();
    }
  }
}

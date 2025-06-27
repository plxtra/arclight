import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { addIcons } from 'ionicons';
import { documents } from 'ionicons/icons';
import { OrderMonitorService } from 'src/app/services/order-monitor.service';
import { OpenOrdersPageComponent } from 'src/app/shared/modal/open-orders/open-orders.page';

@Component({
  selector: 'app-open-orders-control',
  templateUrl: './open-orders-control.component.html',
  styleUrls: ['./open-orders-control.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonButton,
    IonIcon
  ],
})
export class OpenOrdersControlComponent {
  private readonly _orderMonitorService: OrderMonitorService;
  private readonly _modalController: ModalController;

  constructor(orderMonitorSvc: OrderMonitorService, modalController: ModalController) {
    this._orderMonitorService = orderMonitorSvc;
    this._modalController = modalController;

    addIcons({
      documents,
    });
  }

  public get openOrdersAny(): boolean {
    return this._orderMonitorService.openOrdersExist;
  }

  public get openOrdersFill(): string {
    if (this._orderMonitorService.openOrdersChanged)
      return "solid";
    return "clear";
  }

  public showOpenOrders() {
    const modalPromise = this.showOpenOrdersPageComponentModal();
    AssertInternalError.throwErrorIfPromiseRejected(modalPromise, 'OOCCSOO13129');
  }

  private async showOpenOrdersPageComponentModal() {
    const modal = await this._modalController.create({
      component: OpenOrdersPageComponent,
      componentProps: {},
      cssClass: 'new-order-modal',
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
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'OOCCSOO13130') }
    );

    await modal.present();
  }
}

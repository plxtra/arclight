import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBadge,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonRow,
  IonSkeletonText,
  ModalController,
} from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { NewOrderPageComponent } from 'src/app/shared/modal/order-pad/new-order/new-order.page';
import { NewOrderPlacementTransferModel } from 'src/app/shared/models/transfer/new-order-placement.transfermodel';
import { ToastService } from '../../../../services/toast.service';
import { StockDetailBaseDirective } from '../stock-detail.base';

@Component({
  selector: 'app-stock-general',
  templateUrl: './stock-general.page.html',
  styleUrls: ['./stock-general.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    IonContent,
    IonList,
    IonLabel,
    IonItem,
    IonBadge,
    IonItemDivider,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
    IonAccordion,
    IonAccordionGroup,
  ],
})
export class StockGeneralPageComponent extends StockDetailBaseDirective implements OnInit, OnDestroy {
  private readonly _toastService = inject(ToastService);

  private readonly _modalController: ModalController;

  constructor() {
    const modalController = inject(ModalController);

    super();

    this._modalController = modalController;
  }

  public clickNewBidOrder() {
    if (this._dataIvemId === undefined) {
      this._toastService.showToast("Symbol is not set");
    } else {
      const props = {
        side: "buy",
        ivemId: this._dataIvemId.ivemId
      } as NewOrderPlacementTransferModel;
      const promise = this.newOrder(props);
      AssertInternalError.throwErrorIfPromiseRejected(promise, 'SGPCCNBO33090');
    }
  }

  public clickNewAskOrder() {
    if (this._dataIvemId === undefined) {
      this._toastService.showToast("Symbol is not set");
    } else {
      const props = {
        side: "sell",
        ivemId: this._dataIvemId.ivemId
      } as NewOrderPlacementTransferModel

      const promise = this.newOrder(props);
      AssertInternalError.throwErrorIfPromiseRejected(promise, 'SGPCCNAO33090');
    }
  }

  async newOrder(props: NewOrderPlacementTransferModel) {
    const modal = await this._modalController.create({
      component: NewOrderPageComponent,
      componentProps: { primer: props },
      cssClass: 'new-order-modal',
      backdropDismiss: false
    });

    const dismissPromise = modal.onDidDismiss();
    dismissPromise.then(
      (modalResult) => {
        if (modalResult.data) {// not cancelled
          // const data = modalResult.data;
          // toast?
        }
      },
      (reason: unknown) => { AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'SGPNO33090'); }
    );

    await modal.present();
  }
}

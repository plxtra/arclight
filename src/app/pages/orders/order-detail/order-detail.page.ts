
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { SingleOrderCollector } from 'src/app/shared/collectors/single-order-collector';
import { AmendOrderPageComponent } from 'src/app/shared/modal/order-pad/amend-order/amend-order.page';
import { CancelOrderPageComponent } from 'src/app/shared/modal/order-pad/cancel-order/cancel-order.page';
import { AmendOrderPlacementTransferModel } from 'src/app/shared/models/transfer/amend-order-placement.transfermodel';
import { CancelOrderPlacementTransferModel } from 'src/app/shared/models/transfer/cancel-order-placement.transfermodel';
import { OrderViewModel } from 'src/app/shared/models/view/order.viewmodel';
import { OpenOrdersControlComponent } from '../../../components/open-orders-control/open-orders-control.component';
import { StandardSecurityControlComponent } from '../../../components/standard-security-control/standard-security-control.component';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    OpenOrdersControlComponent,
    StandardSecurityControlComponent
  ],
})
export class OrderDetailPageComponent implements OnInit {
  public dataAvailable = false;

  private readonly _route: ActivatedRoute;
  private readonly _modalController: ModalController;
  private readonly _singleOrderCollector: SingleOrderCollector;

  private _accountZenithCode: string;
  private _orderId: string;

  constructor(
    route: ActivatedRoute,
    unifySvc: UnifyService,
    bundeledSvc: BundledService,
    modalController: ModalController,
    singleOrderCollector: SingleOrderCollector,
  ) {
    this._route = route;
    this._modalController = modalController;
    this._singleOrderCollector = singleOrderCollector;
  }

  public get orderDetails(): OrderViewModel | undefined { return this._singleOrderCollector.orderView; }

  ngOnInit() {
    this._accountZenithCode = this._route.snapshot.params.account as string;
    this._orderId = this._route.snapshot.params.id as string;
    this._singleOrderCollector.subscribeToOrder(this._accountZenithCode, this._orderId);
  }

  public async modifySelectedOrder() {
    if (this._orderId) {
      window.arclightLogger.logDebug(`Amend order ${this._orderId}`);

      const props = {
        accountZenithCode: this._accountZenithCode,
        orderId: this._orderId
      } as AmendOrderPlacementTransferModel;

      const modal = await this._modalController.create({
        component: AmendOrderPageComponent,
        componentProps: { primer: props },
        cssClass: 'amend-order-modal',
        backdropDismiss: false
      });

      const modalDismissPromise = modal.onDidDismiss();
      modalDismissPromise.then(
        (modalResult) => {
          if (modalResult.data) { // not cancelled
            // const data = modalResult.data;
            // toast?
          }
        },
        (reason: unknown) => {
          throw AssertInternalError.createIfNotError(reason, 'ODPNOI22009');
        }
      );

      await modal.present();
    }
  }

  public async cancelSelectedOrder() {
    if (this._orderId) {
      window.arclightLogger.logDebug(`Cancel order ${this._orderId}`);

      const props = {
        accountZenithCode: this._accountZenithCode,
        orderId: this._orderId
      } as CancelOrderPlacementTransferModel;

      const modal = await this._modalController.create({
        component: CancelOrderPageComponent,
        componentProps: { primer: props },
        cssClass: 'cancel-order-modal',
        backdropDismiss: false
      });

      const modalDismissPromise = modal.onDidDismiss();
      modalDismissPromise.then(
        (modalResult) => {
          if (modalResult.data) { // not cancelled
            // const data = modalResult.data;
            // toast?
          }
        },
        (reason: unknown) => {
          throw AssertInternalError.createIfNotError(reason, 'ODPNOI22009');
        }
      );

      await modal.present();
    }
  }
}

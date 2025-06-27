
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AssertInternalError } from '@pbkware/js-utils';
import { DeleteNotificationChannelDataDefinition, DeleteNotificationChannelDataItem, QueryNotificationChannelDataDefinition, QueryNotificationChannelDataItem } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { bugOutline, globeOutline, logoApple, logoGoogle, mailOutline, phonePortraitOutline } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { Incubator } from 'src/app/shared/models/supplementary/incubator';
import { NotificationViewModel } from 'src/app/shared/models/view/notification.viewmodel';
import { ScanViewModel } from 'src/app/shared/models/view/scan.viewmodel';
import { BooleanDisplayComponent } from '../../../components/boolean-display/boolean-display.component';
import { ConfirmDeleteComponent } from '../../../components/confirm-delete/confirm-delete.component';
import { OpenOrdersControlComponent } from '../../../components/open-orders-control/open-orders-control.component';

@Component({
  selector: 'app-notification-detail',
  templateUrl: './notification-detail.page.html',
  styleUrls: ['./notification-detail.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    OpenOrdersControlComponent,
    BooleanDisplayComponent,
    ConfirmDeleteComponent
  ],
})
export class NotificationDetailPageComponent implements OnInit {
  public dataAvailableNotification = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _route: ActivatedRoute;
  private readonly _router: Router;

  private _id: string;

  private _model: NotificationViewModel;
  private _viewDataAttachedScans: ScanViewModel[] = [];

  constructor(
    unifySvc: UnifyService,
    bundledSvc: BundledService,
    route: ActivatedRoute,
    router: Router,
  ) {
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._route = route;
    this._router = router;

    addIcons({
      logoApple,
      mailOutline,
      bugOutline,
      logoGoogle,
      phonePortraitOutline,
      globeOutline,
    });
  }

  public get model(): NotificationViewModel {
    return this._model;
  }

  public get viewDataScans(): ScanViewModel[] {
    return this._viewDataAttachedScans;
  }

  ngOnInit() {
    this._id = this._route.snapshot.params.id as string;
    const queryNotificationPromise = this.queryNotification();
    AssertInternalError.throwErrorIfPromiseRejected(queryNotificationPromise, 'NDPNOI88432');
  }

  public handleDelete() {
    window.arclightLogger.logInfo(`DELETE: NotificationChannel ${this._id}`);

    const definition = new DeleteNotificationChannelDataDefinition();
    definition.notificationChannelId = this._id;
    const incubator = new Incubator<DeleteNotificationChannelDataItem>(this._unifySvc, definition);
    const incubatePromise = incubator.incubate();
    incubatePromise.then(
      (di) => {
        if (di !== undefined) {
          if (di.error) {
            throw new AssertInternalError('NDPHDI41133', di.errorText);
          } else {
            incubator.finalise();
            setTimeout(() => {
              const navigatePromise = this._router.navigate(['/', 'notifications'], { replaceUrl: true });
              AssertInternalError.throwErrorIfPromiseRejected(navigatePromise, 'NDPHDN41133');
            });
          }
        }
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'NDPHDIP41133')}
    );
  }

  private async queryNotification() {
    const definition = new QueryNotificationChannelDataDefinition();
    definition.notificationChannelId = this._id;
    const incubator = new Incubator<QueryNotificationChannelDataItem>(this._unifySvc, definition);
    try {
      const di = await incubator.incubate();
      if (di !== undefined) {
        if (di.error) {
          throw Error(di.errorText);
        } else {
          this.dataAvailableNotification = di.usable;
          this._model = NotificationViewModel.newFromDI(di.notificationChannelStateAndSettings, this._bundledSvc);
        }
      }
    } finally {
      incubator.finalise();
    }
  }
}

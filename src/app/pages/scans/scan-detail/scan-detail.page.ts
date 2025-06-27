import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import {
  AssertInternalError,
  Integer,
  MultiEvent,
  UsableListChangeTypeId,
} from '@pbkware/js-utils';
import {
  DataIvemIdMatchesDataDefinition,
  DataIvemIdScanMatchesDataItem,
  DataMarket,
  DeleteScanDataDefinition,
  DeleteScanDataItem,
  MarketsService,
  QueryNotificationChannelsDataDefinition,
  QueryNotificationChannelsDataItem,
  QueryScanDetailDataDefinition,
  QueryScanDetailDataItem,
  ScansService
} from '@plxtra/motif-core';
import { BundledService } from 'src/app/services/bundled.service';
import { ClockService } from 'src/app/services/clock.service';
import { UnifyService } from 'src/app/services/unify.service';
import { ScanDataModel } from 'src/app/shared/models/data/scan.datamodel';
import { Incubator } from 'src/app/shared/models/supplementary/incubator';
import { MarketViewModel } from 'src/app/shared/models/view/market.viewmodel';
import { NotificationViewModel } from 'src/app/shared/models/view/notification.viewmodel';
import { SecurityViewModel } from 'src/app/shared/models/view/security.viewmodel';
import { ConfirmDeleteComponent } from '../../../components/confirm-delete/confirm-delete.component';
import { OpenOrdersControlComponent } from '../../../components/open-orders-control/open-orders-control.component';
import { ScanSummaryComponent } from '../../../components/scan-summary/scan-summary.component';

@Component({
  selector: 'app-scan-detail',
  templateUrl: './scan-detail.page.html',
  styleUrls: ['./scan-detail.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    ScrollingModule,
    ScanSummaryComponent,
    ConfirmDeleteComponent,
    OpenOrdersControlComponent
  ],
})
export class ScanDetailPageComponent implements OnInit, OnDestroy {
  public dataAvailable = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _route: ActivatedRoute;
  private readonly _router: Router;
  private readonly _clockSvc: ClockService;
  private readonly _scansSvc: ScansService;
  private readonly _modalController: ModalController;
  private readonly _markets: MarketsService.Markets<DataMarket>;

  private _marketsListChangeSubscriptionId: MultiEvent.SubscriptionId;

  private _matchesDI: DataIvemIdScanMatchesDataItem;
  private _subidMatchesEndChanges: MultiEvent.SubscriptionId;
  private _subidMatchesListUpdate: MultiEvent.SubscriptionId;

  private _id: string;
  private _scan: ScanDataModel;
  private _viewDataStream: SecurityViewModel[] = [];

  constructor(
    route: ActivatedRoute,
    router: Router,
    unifySvc: UnifyService,
    bundeledSvc: BundledService,
    clockSvc: ClockService,
    modalController: ModalController,
  ) {
    this._route = route;
    this._router = router;
    this._unifySvc = unifySvc;
    this._bundledSvc = bundeledSvc;
    this._clockSvc = clockSvc;
    this._modalController = modalController;
    this._markets = this._unifySvc.marketsService.defaultExchangeEnvironmentDataMarkets;

    this._scansSvc = unifySvc.scansService;
    this._scan = new ScanDataModel(this._bundledSvc);
  }

  public get Id(): string {
    return this._id;
  }

  public get scan(): ScanDataModel {
    return this._scan;
  }

  public get viewDataStream(): SecurityViewModel[] {
    return this._viewDataStream;
  }

  public get anyStreamData(): boolean {
    return (this._viewDataStream.length > 0);
  }

  ngOnInit() {
    const initPromise = this.init();
    AssertInternalError.throwErrorIfPromiseRejected(initPromise, 'SDPNOI65591');
  }

  ngOnDestroy() {
    this._matchesDI.unsubscribeEndChangesEvent(this._subidMatchesEndChanges);
    this._matchesDI.unsubscribeListChangeEvent(this._subidMatchesListUpdate);
    this._unifySvc.adi.unsubscribe(this._matchesDI);

    this._markets.unsubscribeListChangeEvent(this._marketsListChangeSubscriptionId);
    this._marketsListChangeSubscriptionId = undefined;
  }

  public async handleDelete() {
    window.arclightLogger.logInfo(`DELETE: Scan ${ this._id}`);
    const definition = new DeleteScanDataDefinition();
    definition.scanId = this._id;
    const incubator = new Incubator<DeleteScanDataItem>(this._unifySvc, definition);
    try {
      const di = await incubator.incubate();
      if (di !== undefined) {
        if (di.error) {
          throw Error(di.errorText);
        } else {
          setTimeout(() => {
            const navigatePromise = this._router.navigate(['/', 'notifications'], { replaceUrl: true });
            AssertInternalError.throwErrorIfPromiseRejected(navigatePromise, 'SDPHD65592');
          });
        }
      }
    } finally {
      incubator.finalise();
    }
  }

  private async init() {
    this._id = this._route.snapshot.params.id as string;
    // retrieve Scan
    const definitionScan = new QueryScanDetailDataDefinition();
    definitionScan.scanId = this._id;
    const incubatorScan = new Incubator<QueryScanDetailDataItem>(this._unifySvc, definitionScan);
    try {
      const di = await incubatorScan.incubate();
      if (di !== undefined) {
        if (di.error) {
          throw Error(di.errorText);
        } else {
          await this.loadViewData(di);
        }
      }
    } finally {
      incubatorScan.finalise();
    }
    // retrieve all notification channels
    const definitionNotification = new QueryNotificationChannelsDataDefinition();
    const incubatorNotifications = new Incubator<QueryNotificationChannelsDataItem>(this._unifySvc, definitionNotification);
    try {
      const di = await incubatorNotifications.incubate();
      if (di !== undefined) {
        if (di.error) {
          throw Error(di.errorText);
        } else {
          this.loadNotificationsData(di);
        }
      }
    } finally {
      incubatorNotifications.finalise();
    }
    // retrieve all markets
    this._marketsListChangeSubscriptionId = this._markets.subscribeListChangeEvent((listChangeTypeId) => {
      this.handleMarketsUpdate(listChangeTypeId);
    });
    this.handleMarketsUpdate(UsableListChangeTypeId.Insert);
    // retrieve all scan matches
    // return;

    const defintionMatches = new DataIvemIdMatchesDataDefinition();
    defintionMatches.scanId = this._id;
    this._matchesDI = this._unifySvc.adi.subscribe(defintionMatches) as DataIvemIdScanMatchesDataItem;
    this._subidMatchesEndChanges = this._matchesDI.subscribeEndChangesEvent(() => {
      this.handleMatchesUpdate();
    });
    this._subidMatchesListUpdate = this._matchesDI.subscribeListChangeEvent((t, i, c) => {
      this.handleMatchesListChange(t, i, c);
    })
    this.handleMatchesUpdate();
  }

  private async loadViewData(di: QueryScanDetailDataItem) {
    if (di.usable) {
      await this._scan.loadFromDI(di);
    }
    this.dataAvailable = di.usable;
  }

  private handleMarketsUpdate(listChangeTypeId: UsableListChangeTypeId) {
    if (listChangeTypeId === UsableListChangeTypeId.PreUsableAdd || listChangeTypeId === UsableListChangeTypeId.Insert) {
      // Can only add markets
      const markets = this._markets.toArray().map((r) => MarketViewModel.newFromDI(this._clockSvc, this._bundledSvc, r));
      this._scan.reloadAvailableMarkets(markets);
    }
  }

  private loadNotificationsData(di: QueryNotificationChannelsDataItem) {
    if (di.usable) {
      const notifications = di.notificationChannels.map(n => NotificationViewModel.newFromDI(n, this._bundledSvc));
      this._scan.reloadAvailableNotifications(notifications);
    }
  }

  private handleMatchesUpdate() {
    if (this._matchesDI.usable) {
      // let mat = this._matchesDI.toArray();
      // let ivems = mat.map(n => n.value);
      // window.motifLogger.logInfo(`Match ${ JSON.stringify(ivems}`));
    }
  }

  private handleMatchesListChange(listChangeTypeId: UsableListChangeTypeId, idx: Integer, count: Integer) {
    if (this._matchesDI.usable) {
      let change="";
      switch (listChangeTypeId) {
        case UsableListChangeTypeId.Unusable:
          change = "Unusable";
          break;
        case UsableListChangeTypeId.PreUsableAdd:
          change = "PreUsableAdd";
          break;
        case UsableListChangeTypeId.PreUsableClear:
          change = "PreUsableClear";
          break;
        case UsableListChangeTypeId.Usable:
          change = "Usable";
          break;
        case UsableListChangeTypeId.Insert:
          change = "Insert";
          break;
        case UsableListChangeTypeId.BeforeReplace:
          change = "BeforeReplace";
          break;
        case UsableListChangeTypeId.AfterReplace:
          change = "AfterReplace";
          break;
        case UsableListChangeTypeId.BeforeMove:
          change = "BeforeMove";
          break;
        case UsableListChangeTypeId.AfterMove:
          change = "AfterMove";
          break;
        case UsableListChangeTypeId.Remove:
          change = "Remove";
          break;
        case UsableListChangeTypeId.Clear:
          change = "Clear";
          break;
      }
      window.arclightLogger.logDebug(`Matches list state: ${change}, ${idx}, ${count}}`);
      // let mat = this._matchesDI.rankedMatches.toArray();
      // let ivems = mat.map(n => n.value);
      // window.motifLogger.logInfo(`Match change ${ JSON.stringify(ivems}`));
    }
  }
}

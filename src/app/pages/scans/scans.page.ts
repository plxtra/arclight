
import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController, IonRouterLink, ModalController } from '@ionic/angular/standalone';
import { AssertInternalError, Integer, MultiEvent, UsableListChangeTypeId } from '@pbkware/js-utils';
import { Feed, FeedStatusId, ScansService } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { addSharp } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { LockerHandleService } from 'src/app/services/locker-handle.service';
import { UnifyService } from 'src/app/services/unify.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { AlterScanPageComponent } from 'src/app/shared/modal/alter-scan/alter-scan.page';
import { AlterScanTransferModel } from 'src/app/shared/models/transfer/alter-scan.transfermodel';
import { ScanViewModel } from 'src/app/shared/models/view/scan.viewmodel';
import { ListDataTemplateDirective } from 'src/app/templates/list-data.template';
import { OpenOrdersControlComponent } from '../../components/open-orders-control/open-orders-control.component';
import { FeedsService } from '../../services/feeds.service';

@Component({
  selector: 'app-scans',
  templateUrl: './scans.page.html',
  styleUrls: ['./scans.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonRouterLink,
    IonicModule,
    OpenOrdersControlComponent
  ],
})
export class ScansPageComponent extends ListDataTemplateDirective<ScanViewModel> implements OnDestroy {
  private readonly _cdr = inject(ChangeDetectorRef);

  public feedActive: boolean; // will be initialised in constructor

  private readonly _unifySvc: UnifyService;
  private readonly _scansSvc: ScansService;
  private readonly _bundledSvc: BundledService;
  private readonly _configSvc: ConfigurationService;
  private readonly _sessionSvc: UserSessionService;
  private readonly _alertController: AlertController;
  private readonly _lockerHandle: LockerHandleService;
  private readonly _modalController: ModalController;
  private readonly _scannerFeed: Feed | undefined;

  private _subidListChange: MultiEvent.SubscriptionId;
  private _scannerFeedStatusChangedSubscriptionId: MultiEvent.SubscriptionId;

  private _anyScans = false;

  constructor() {
    const modalController = inject(ModalController);
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const alertController = inject(AlertController);
    const configSvc = inject(ConfigurationService);
    const sessionSvc = inject(UserSessionService);
    const lockerHandleService = inject(LockerHandleService);
    const feedsService = inject(FeedsService);

    super();
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._alertController = alertController;
    this._configSvc = configSvc;
    this._sessionSvc = sessionSvc;
    this._lockerHandle = lockerHandleService;
    this._modalController = modalController;

    this._scansSvc = unifySvc.scansService;

    this._scannerFeed = feedsService.scanner;
    if (this._scannerFeed !== undefined) {
      this._scannerFeedStatusChangedSubscriptionId = this._scannerFeed.subscribeStatusChangedEvent(() => this.processScannerFeedStatusChange());
    }

    this.processScannerFeedStatusChange();

    addIcons({
      addSharp,
    });
  }

  public get anyScans(): boolean {
    return this._anyScans;
  }

  public get badgeColour(): string {
    if (this.isViewDataFiltered) return "tertiary";
    return "secondary";
  }

  ngOnDestroy() {
    this.checkUnsubscribeListChangeEvent();
    if (this._scannerFeed !== undefined && this._scannerFeedStatusChangedSubscriptionId !== undefined) {
      this._scannerFeed.unsubscribeStatusChangedEvent(this._scannerFeedStatusChangedSubscriptionId);
      this._scannerFeedStatusChangedSubscriptionId = undefined;
    }
  }

  public async addNewScan() {
    const modalPrime = {
      scanId: "",
      deleting: false,
    } as AlterScanTransferModel;

    const modal = await this._modalController.create({
      component: AlterScanPageComponent,
      componentProps: { prime: modalPrime },
      cssClass: 'alter-scan-modal',
      backdropDismiss: false
    });

    const dismissPromise = modal.onDidDismiss();
    dismissPromise.then(
      (modalResult) => {
        if (modalResult.data) { // not cancelled
          // return data
          // const response = modalResult.data as ScanUpdateResponseTransferModel;
        }
      },
      (reason: unknown) => { AssertInternalError.createIfNotError(reason, 'NPANS43091'); }
    );

    await modal.present();
  }

  protected resolveFilterLambda(model: ScanViewModel): boolean {
    return (model.name.toLowerCase().includes(this._searchText.toLowerCase())
      || model.description.toLowerCase().includes(this._searchText.toLowerCase()));
  }

  private loadIsUsable(): void {
    this._dataAvailable = this._scansSvc.scanList.usable;
  }

  private loadViewDataScans() {
    this._viewData = this._scansSvc.scanList.toArray().map((rec) => ScanViewModel.newFromDI(rec, this._bundledSvc));
    this._anyScans = this.dataAvailable && this._viewData.length > 0;
  }

  private handleListChange(listChangeTypeId: UsableListChangeTypeId, index: Integer, count: Integer): void {
    switch (listChangeTypeId) {
      case UsableListChangeTypeId.AfterMove:
      case UsableListChangeTypeId.AfterReplace:
      case UsableListChangeTypeId.BeforeMove:
      case UsableListChangeTypeId.BeforeReplace:
      case UsableListChangeTypeId.Clear:
      case UsableListChangeTypeId.Insert:
      case UsableListChangeTypeId.PreUsableAdd:
      case UsableListChangeTypeId.PreUsableClear:
      case UsableListChangeTypeId.Remove:
        // ignore
        break;
      case UsableListChangeTypeId.Unusable:
        this.loadIsUsable();
        break;
      case UsableListChangeTypeId.Usable:
        this.loadIsUsable();
        this.loadViewDataScans();
        break;
    }
  }

  private processScannerFeedStatusChange(): void {
    const scannerFeed = this._scannerFeed;
    const feedActive = (scannerFeed !== undefined && scannerFeed.statusId === FeedStatusId.Active);
    if (feedActive !== this.feedActive) {
      this.feedActive = feedActive;
      this._cdr.markForCheck();
      if (feedActive) {
        this._subidListChange = this._scansSvc.scanList.subscribeListChangeEvent((changeType, idx, count) => this.handleListChange(changeType, idx, count));
        this.loadIsUsable();
        this.loadViewDataScans();
      } else {
        this.checkUnsubscribeListChangeEvent();
      }
    }
  }

  private checkUnsubscribeListChangeEvent(): void {
    if (this._subidListChange !== undefined) {
      this._scansSvc.scanList.unsubscribeListChangeEvent(this._subidListChange);
      this._subidListChange = undefined;
    }
  }
}


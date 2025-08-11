import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonCol,
  IonContent,
  IonGrid,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { DepthDataDefinition, DepthDataItem, DepthStyleId, FullDepthSideGridRecordStore, OrderSideId, SecurityDataItem } from '@plxtra/motif-core';
import { UserSessionService } from 'src/app/services/user-session.service';
import { FullDepthHousing } from 'src/app/shared/housing/fulldepth-housing';
import { FullDepthViewData } from 'src/app/shared/models/view/fulldepth.viewmodel';
import { zstring } from 'src/app/shared/types/nullable-types';
import { ThrottledChangeDetector } from 'src/app/shared/types/throttled-change-detector';
import { StockDetailBaseDirective } from '../stock-detail.base';

@Component({
  selector: 'app-stock-depth',
  templateUrl: './stock-depth.page.html',
  styleUrls: ['./stock-depth.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    IonContent,
    IonList,
    IonLabel,
    IonItem,
    IonSpinner,
    IonItemDivider,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
  ],
})
export class StockDepthPageComponent extends StockDetailBaseDirective implements OnInit, OnDestroy {
  public dataAvailableDepth = false;

  private readonly _sessionService: UserSessionService;

  private _tcd: ThrottledChangeDetector;

  private _depthDI: DepthDataItem | undefined;
  private _subidUsable: MultiEvent.SubscriptionId;
  private _bidRecordStore: FullDepthSideGridRecordStore | undefined;
  private _bidHousing: FullDepthHousing | undefined;
  private _askRecordStore: FullDepthSideGridRecordStore | undefined;
  private _askHousing: FullDepthHousing | undefined;

  private _subidSecurityFieldValuesChanged: MultiEvent.SubscriptionId;

  private _depthFormat: zstring;

  private _skeletonList: FullDepthViewData[];

  constructor() {
    const cdr = inject(ChangeDetectorRef);
    const sessionSvc = inject(UserSessionService);

    super();

    this._sessionService = sessionSvc;

    cdr.detach();
    this._tcd = new ThrottledChangeDetector(cdr);

    this._skeletonList = new Array<FullDepthViewData>(5);
    this.depthFormat = "levels"
  }

  public get askLevelList(): FullDepthViewData[] {
    if (this.dataAvailableDepth && this._askHousing !== undefined) {
      return this._askHousing.viewDatas;
    } else {
      return this._skeletonList;
    }
  }

  public get bidLevelList(): FullDepthViewData[] {
    if (this.dataAvailableDepth && this._bidHousing !== undefined) {
      return this._bidHousing.viewDatas;
    } else {
      return this._skeletonList;
    }
  }

  public get depthFormat(): zstring {
    return this._depthFormat;
  }
  public set depthFormat(v: zstring) {
    if (this._depthFormat !== v) {
      this._depthFormat = v;
      if (this._bidRecordStore && this._askRecordStore) {
        switch (this._depthFormat) {
          case "levels":
            this._bidRecordStore.setAllRecordsToPriceLevel();
            this._askRecordStore.setAllRecordsToPriceLevel();
            break;
          case "orders":
            this._bidRecordStore.setAllRecordsToOrder();
            this._askRecordStore.setAllRecordsToOrder();
            break;
        }
        this._tcd.detectChanges();
      }
    }
  }

  public get isOrderView(): boolean {
    return (this._depthFormat === "orders");
  }

  override ngOnInit() {
    super.ngOnInit()

    this.subscribeToDepth();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();

    this.checkUnsubscribeFromDepth();
  }

  trackFullDepth(index: number, depth: FullDepthViewData | undefined) {
    return depth ? depth.index : undefined;
  }

  private subscribeToDepth(): void {
    this.dataAvailableDepth = false;

    if (this._dataIvemId) {
      const bidRecordStore = new FullDepthSideGridRecordStore(
        this._unifySvc.decimalFactory,
        this._unifySvc.marketsService,
        this._sessionService.sessionInfoService,
        DepthStyleId.Full,
        OrderSideId.Bid
      );
      this._bidRecordStore = bidRecordStore;
      this._bidHousing = new FullDepthHousing(bidRecordStore, this._tcd, this._bundledSvc);
      bidRecordStore.setRecordEventers(this._bidHousing)
      const askRecordStore = new FullDepthSideGridRecordStore(
        this._unifySvc.decimalFactory,
        this._unifySvc.marketsService,
        this._sessionService.sessionInfoService,
        DepthStyleId.Full,
        OrderSideId.Ask
      );
      this._askRecordStore = askRecordStore;
      this._askHousing = new FullDepthHousing(askRecordStore, this._tcd, this._bundledSvc);
      askRecordStore.setRecordEventers(this._askHousing);

      const securityDI = this._securityDI;
      if (securityDI === undefined) {
        throw new AssertInternalError('SDPSTD56681');
      } else {
        askRecordStore.setAuctionQuantity(securityDI.auctionQuantity);
        bidRecordStore.setAuctionQuantity(securityDI.auctionQuantity);

        const definition = new DepthDataDefinition();
        definition.code = this._dataIvemId.code;
        definition.marketZenithCode = this._dataIvemId.marketZenithCode;
        this._depthDI = this._unifySvc.adi.subscribe(definition) as DepthDataItem;

        bidRecordStore.open(this._depthDI, (this.depthFormat === 'orders'));
        askRecordStore.open(this._depthDI, (this.depthFormat === 'orders'));

        this.loadIsUsable()

        this._subidUsable = this._depthDI.subscribeCorrectnessChangedEvent(() => this.loadIsUsable());

        // track auctionQuantity
        this._subidSecurityFieldValuesChanged = securityDI.subscribeFieldValuesChangedEvent((changes) => {
          changes.forEach(chg => {
            if (chg.fieldId === SecurityDataItem.FieldId.AuctionQuantity) {
              askRecordStore.setAuctionQuantity(securityDI.auctionQuantity);
              bidRecordStore.setAuctionQuantity(securityDI.auctionQuantity);
            }
          });
        });
      }
    }
  }

  private loadIsUsable(): void {
    this.dataAvailableDepth = this._depthDI !== undefined && this._depthDI.usable;
    this._tcd.detectChanges();
  }

  private checkUnsubscribeFromDepth(): void {
    if (this._depthDI !== undefined) {
      if (this._securityDI === undefined) {
        throw new AssertInternalError('SDPCUFDSD56682');
      } else {
        this._securityDI.unsubscribeFieldValuesChangedEvent(this._subidSecurityFieldValuesChanged);
        if (this._bidRecordStore === undefined || this._askRecordStore === undefined) {
          throw new AssertInternalError('SDPCUFDBA56683');
        } else {
          this._bidRecordStore.close();
          this._askRecordStore.close();
          this._depthDI.unsubscribeCorrectnessChangedEvent(this._subidUsable);
          this._unifySvc.adi.unsubscribe(this._depthDI);
          this._bidHousing = undefined;
          this._askHousing = undefined;
          this._bidRecordStore = undefined;
          this._askRecordStore = undefined;
          this._depthDI = undefined;
        }
      }
    }
  }
}

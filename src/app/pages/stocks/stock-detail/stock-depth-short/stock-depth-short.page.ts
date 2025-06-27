import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { DepthLevelsDataDefinition, DepthLevelsDataItem, DepthStyleId, OrderSideId, SecurityDataItem, ShortDepthSideGridRecordStore } from '@plxtra/motif-core';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ShortDepthHousing } from 'src/app/shared/housing/shortdepth-housing';
import { ShortDepthViewData } from 'src/app/shared/models/view/shortdepth.viewmodel';
import { ThrottledChangeDetector } from 'src/app/shared/types/throttled-change-detector';
import { StockDetailBaseDirective } from '../stock-detail.base';

@Component({
  selector: 'app-stock-depth-short',
  templateUrl: './stock-depth-short.page.html',
  styleUrls: ['./stock-depth-short.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScrollingModule,
  ],
})
export class StockDepthShortPageComponent extends StockDetailBaseDirective implements OnInit, OnDestroy {
  public dataAvailableDepth = false;

  private readonly _sessionService: UserSessionService;

  private _tcd: ThrottledChangeDetector;

  private _depthDI: DepthLevelsDataItem | undefined;
  private _subidUsable: MultiEvent.SubscriptionId;
  private _bidRecordStore: ShortDepthSideGridRecordStore | undefined;
  private _bidHousing: ShortDepthHousing | undefined;
  private _askRecordStore: ShortDepthSideGridRecordStore | undefined;
  private _askHousing: ShortDepthHousing | undefined;

  private _subidSecurityFieldValuesChanged: MultiEvent.SubscriptionId;

  private _skeletonList: ShortDepthViewData[];

  constructor(
    route: ActivatedRoute,
    cdr: ChangeDetectorRef,
    unifySvc: UnifyService,
    bundledSvc: BundledService,
    sessionSvc: UserSessionService,
  ) {
    super(route, unifySvc, bundledSvc);
    this._sessionService = sessionSvc;

    cdr.detach();
    this._tcd = new ThrottledChangeDetector(cdr);

    this._skeletonList = new Array<ShortDepthViewData>(5);
  }

  public get askLevelList() {
    if (this.dataAvailableDepth && this._askHousing !== undefined) return this._askHousing.viewDatas;
    else return this._skeletonList;
  }

  public get bidLevelList() {
    if (this.dataAvailableDepth && this._bidHousing !== undefined) return this._bidHousing.viewDatas;
    else return this._skeletonList;
  }

  override ngOnInit() {
    super.ngOnInit()

    this.subscribeToDepth();
    if (this._bidRecordStore === undefined || this._askRecordStore === undefined) {
      throw new AssertInternalError('SDSPNOI56680');
    } else {
      this._bidRecordStore.setAllRecordsToPriceLevel();
      this._askRecordStore.setAllRecordsToPriceLevel();
    }
}

  override ngOnDestroy() {
    super.ngOnDestroy();

    this.checkUnsubscribeFromDepth();
  }

  public trackFullDepth(index: number, depth: ShortDepthViewData | undefined) {
    return depth ? depth.index : undefined;
  }

  private subscribeToDepth(): void {
    this.dataAvailableDepth = false;

    if (this._dataIvemId) {
      const bidRecordStore = new ShortDepthSideGridRecordStore(this._unifySvc.decimalFactory, this._unifySvc.marketsService, DepthStyleId.Short, OrderSideId.Bid);
      this._bidRecordStore = bidRecordStore
      this._bidHousing = new ShortDepthHousing(bidRecordStore, this._tcd, this._bundledSvc);
      bidRecordStore.setRecordEventers(this._bidHousing)
      const askRecordStore = new ShortDepthSideGridRecordStore(this._unifySvc.decimalFactory, this._unifySvc.marketsService, DepthStyleId.Short, OrderSideId.Ask);
      this._askRecordStore = askRecordStore;
      this._askHousing = new ShortDepthHousing(askRecordStore, this._tcd, this._bundledSvc);
      askRecordStore.setRecordEventers(this._askHousing);

      const securityDI = this._securityDI;
      if (securityDI === undefined) {
        throw new AssertInternalError('SDSPSTD56681');
      } else {
        askRecordStore.setAuctionQuantity(securityDI.auctionQuantity);
        bidRecordStore.setAuctionQuantity(securityDI.auctionQuantity);

        const definition = new DepthLevelsDataDefinition();
        definition.code = this._dataIvemId.code;
        definition.marketZenithCode = this._dataIvemId.marketZenithCode;
        const depthDI = this._unifySvc.adi.subscribe(definition) as DepthLevelsDataItem;
        this._depthDI = depthDI;

        bidRecordStore.open(depthDI);
        askRecordStore.open(depthDI);

        this.loadIsUsable(depthDI);

        this._subidUsable = depthDI.subscribeCorrectnessChangedEvent(() => this.loadIsUsable(depthDI));

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

  private checkUnsubscribeFromDepth(): void {
    if (this._depthDI !== undefined) {
      if (this._securityDI === undefined) {
        throw new AssertInternalError('SDSPCUFDSD56682');
      } else {
        this._securityDI.unsubscribeFieldValuesChangedEvent(this._subidSecurityFieldValuesChanged);
        if (this._bidRecordStore === undefined || this._askRecordStore === undefined) {
          throw new AssertInternalError('SDSPCUFDBA56683');
        } else {
          this._bidRecordStore.close();
          this._askRecordStore.close();
          this._depthDI.unsubscribeCorrectnessChangedEvent(this._subidUsable);
          this._unifySvc.adi.unsubscribe(this._depthDI);
          this._bidHousing = undefined;
          this._askHousing = undefined;
          this._bidRecordStore = undefined;
          this._askRecordStore = undefined;
        }
      }
    }
  }

  private loadIsUsable(depthDI: DepthLevelsDataItem): void {
    this.dataAvailableDepth = depthDI.usable;
    this._tcd.detectChanges();
  }
}

import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { DayTradesDataDefinition, DayTradesDataItem, DayTradesGridRecordStore } from '@plxtra/motif-core';
import { parseISO } from 'date-fns';
import { addIcons } from 'ionicons';
import { calendarSharp } from 'ionicons/icons';
import { TradesHousing } from 'src/app/shared/housing/trades-housing';
import { ThrottledChangeDetector } from 'src/app/shared/types/throttled-change-detector';
import { DayTradesViewData } from '../../../../shared/models/view/daytrade.viewmodel';
import { StockDetailBaseDirective } from '../stock-detail.base';

@Component({
  selector: 'app-stock-trades',
  templateUrl: './stock-trades.page.html',
  styleUrls: ['./stock-trades.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScrollingModule,
  ],
})
export class StockTradesPageComponent extends StockDetailBaseDirective implements OnInit, OnDestroy {
  public dataAvailableTrades: boolean;
  public hasTrades: boolean;

  public viewportHeaderTop = '0px';

  private _tcd: ThrottledChangeDetector;

  private _tradesDI: DayTradesDataItem | undefined;
  private _tradesRecordStore: DayTradesGridRecordStore | undefined;
  private _tradesHousing: TradesHousing | undefined;
  private _subidUsableTrades: MultiEvent.SubscriptionId;

  private _atDate8601: string;
  private _skeletonList: DayTradesViewData[];

  // https://github.com/angular/components/issues/14833#issuecomment-1023341138
  private _cdkVirtualScrollViewport: CdkVirtualScrollViewport | undefined;

  constructor() {
    const cdr = inject(ChangeDetectorRef);

    super();

    cdr.detach();
    this._tcd = new ThrottledChangeDetector(cdr);

    this._skeletonList = [];

    addIcons({
      calendarSharp,
    });
  }

  @ViewChild(CdkVirtualScrollViewport, { static: false })
  private set SetViewport(cdkVirtualScrollViewport: CdkVirtualScrollViewport) {
    if (this._cdkVirtualScrollViewport !== cdkVirtualScrollViewport) {
      this._cdkVirtualScrollViewport = cdkVirtualScrollViewport;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this._cdkVirtualScrollViewport['_scrollStrategy'].onRenderedOffsetChanged = () => {
        (this.viewportHeaderTop = `-${cdkVirtualScrollViewport.getOffsetToRenderedContentStart()}px`);
        this._tcd.detectChanges();
      }
    }
  }

  public get tradesList(): DayTradesViewData[] {
    if (this.dataAvailableTrades) {
      if (this._tradesHousing === undefined) {
        throw new AssertInternalError('STPGTL03032' );
      } else {
        return this._tradesHousing.viewDataRecent
      }
    } else {
      return this._skeletonList;
    }
  }

  public set atDate(dt: string) {
    if (this._atDate8601 !== dt) {
      this._atDate8601 = dt;
      this.subscribeToTrades();
    }
  }

  public get atDate(): string {
    return this._atDate8601;
  }

  override ngOnInit() {
    super.ngOnInit();
    this.hasTrades = true;

    this.subscribeToTrades();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();

    this.checkUnsubscribeFromTrades();
  }

  private subscribeToTrades(): void {
    this.checkUnsubscribeFromTrades();

    this.dataAvailableTrades = false;

    if (this._dataIvemId) {
      this._tradesRecordStore = new DayTradesGridRecordStore();
      this._tradesHousing = new TradesHousing(this._tradesRecordStore, this._tcd, this._bundledSvc);
      this._tradesRecordStore.setRecordEventers(this._tradesHousing)

      const definition = new DayTradesDataDefinition();
      definition.code = this._dataIvemId.code;
      definition.marketZenithCode = this._dataIvemId.marketZenithCode;
      if (this._atDate8601) {
        definition.date = parseISO(this._atDate8601);
      }
      this._tradesDI = this._unifySvc.adi.subscribe(definition) as DayTradesDataItem;

      this._tradesHousing.assignDataItem(this._tradesDI);

      this.loadIsUsableTrades()

      this._subidUsableTrades = this._tradesDI.subscribeCorrectnessChangedEvent(() => this.loadIsUsableTrades())
    }
  }

  private loadIsUsableTrades(): void {
    if (this._tradesDI === undefined) {
      throw new AssertInternalError('STPLIT03031');
    } else {
      this.dataAvailableTrades = this._tradesDI.usable;
      this._tcd.detectChanges();
    }
  }

  private checkUnsubscribeFromTrades(): void {
    if (this._tradesHousing) {
      this._tradesHousing = undefined;
    }
    if (this._tradesDI !== undefined) {
      if (this._tradesRecordStore === undefined) {
        throw new AssertInternalError('STPCUFT03030');
      } else {
        this._tradesRecordStore.clearDataItem();
        this._tradesDI.unsubscribeCorrectnessChangedEvent(this._subidUsableTrades)
        this._unifySvc.adi.unsubscribe(this._tradesDI);
        this._tradesHousing = undefined;
        this._tradesRecordStore = undefined;
      }
    }
  }
}

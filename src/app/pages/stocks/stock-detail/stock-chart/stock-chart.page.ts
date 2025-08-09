import { ScrollingModule } from '@angular/cdk/scrolling';

import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SourceTzOffsetDateTime } from '@pbkware/js-utils';
import {
  AccumulationIntervalHistorySequenceSeries,
  Badness,
  DataIvemIdPriceVolumeSequenceHistory,
  IntervalHistorySequencer,
  NumberHistorySequenceSeriesInterface,
  OhlcHistorySequenceSeriesInterface,
  OhlcIntervalHistorySequenceSeries,
} from '@plxtra/motif-core';

import 'highcharts/esm/highcharts-more.js';
import Highcharts from 'highcharts/esm/highstock.js';
import 'highcharts/esm/indicators/indicators-all.js';
import 'highcharts/esm/modules/accessibility.js';
import 'highcharts/esm/modules/annotations-advanced.js';
import 'highcharts/esm/modules/boost.js';
import 'highcharts/esm/modules/drag-panes.js';
import 'highcharts/esm/modules/no-data-to-display.js';
import 'highcharts/esm/modules/price-indicator.js';
import 'highcharts/esm/modules/stock-tools.js';
import 'highcharts/esm/themes/adaptive.js';
// import * as ExampleDarkTheme from 'highcharts/themes/dark-unica.js';
// import 'highcharts/css/themes/dark-unica.css';


// import * as Highcharts from 'highcharts';
// import * as More from 'highcharts/highcharts-more';
// import * as Indicators from 'highcharts/indicators/indicators-all';
// import * as RSI from 'highcharts/indicators/rsi';
// import * as Accessibility from 'highcharts/modules/accessibility';
// import * as AdvAnnotations from 'highcharts/modules/annotations-advanced';
// import * as Boost from 'highcharts/modules/boost';
// import * as DragPanes from 'highcharts/modules/drag-panes';
// import * as NoData from 'highcharts/modules/no-data-to-display';
// import * as PriceIndicator from 'highcharts/modules/price-indicator';
// import * as StockCharts from 'highcharts/modules/stock';
// import * as StockTools from 'highcharts/modules/stock-tools';
// import * as ExampleDarkTheme from 'highcharts/themes/dark-unica';
import { addIcons } from 'ionicons';
import { constructSharp } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { bufferTime } from 'rxjs/operators';
import { ThemeService } from 'src/app/services/theme.service';
import { SourceTzOffsetDateTimeExt } from 'src/app/shared/types/shared-types';
import { StockDetailBaseDirective } from '../stock-detail.base';


@Component({
  selector: 'app-stock-chart',
  templateUrl: './stock-chart.page.html',
  styleUrls: ['./stock-chart.page.scss'],
  imports: [
    FormsModule,
    IonicModule,
    ScrollingModule
  ],
})
export class StockChartPageComponent extends StockDetailBaseDirective implements OnInit, OnDestroy, AfterViewInit {
  // Example of chart that will respect it's containers width and height
  // https://codepen.io/lellky/pen/apVzEe

  @ViewChild('chartPlaceholder', { static: true }) chartPlaceholder: { nativeElement: HTMLDivElement };

  private readonly _themeSvc = inject(ThemeService);

  private _historySource: DataIvemIdPriceVolumeSequenceHistory | undefined;
  private _sequencer: IntervalHistorySequencer;
  private _ohlc: OhlcHistorySequenceSeriesInterface;
  private _volume: NumberHistorySequenceSeriesInterface;
  private _last: OhlcHistorySequenceSeriesInterface;
  private _chart: Highcharts.Chart | undefined;
  private _displayTZ: SourceTzOffsetDateTime.TimezoneModeId;

  private readonly colorindex_OHLC = 1;
  private readonly colorIndex_Volume = 2;
  private readonly colorIndex_Last = 3;

  private readonly _redrawThrottleOHLC: Subject<SeriesChangeEvent>;
  private readonly _redrawThrottleVolume: Subject<SeriesChangeEvent>;
  private readonly _redrawThrottleLast: Subject<SeriesChangeEvent>;
  private readonly _redrawThrottlePeriodMs: number = 500;

  constructor() {
    super();

    // StockCharts.default(Highcharts);

    // Boost.default(Highcharts);
    // More.default(Highcharts);
    // NoData.default(Highcharts);

    // Indicators.default(Highcharts);
    // RSI.default(Highcharts);

    // DragPanes.default(Highcharts);
    // AdvAnnotations.default(Highcharts);
    // PriceIndicator.default(Highcharts);
    // StockTools.default(Highcharts);

    // Accessibility.default(Highcharts);

    this._displayTZ = this._bundledSvc.personalisationService.displayTimeZoneToModeId();

    this._redrawThrottleOHLC = new Subject<SeriesChangeEvent>();
    this._redrawThrottleOHLC.pipe(bufferTime(this._redrawThrottlePeriodMs)).subscribe({
      next: (args) => {
        if (args.length > 0 && this._chart !== undefined) {
          for (const lastEvent of args) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (lastEvent !== null)
              this._chart.series[0].removePoint(lastEvent.pointIndex, false);
            this._chart.series[0].addPoint(lastEvent.point, false);
          }
          this._chart.redraw();
          window.arclightLogger.logDebug('OHLC series updated');
        }
      }
    });
    this._redrawThrottleVolume = new Subject<SeriesChangeEvent>();
    this._redrawThrottleVolume.pipe(bufferTime(this._redrawThrottlePeriodMs)).subscribe({
      next: (args) => {
        if (args.length > 0 && this._chart !== undefined) {
          const lastEvent = args[args.length - 1];
          this._chart.series[1].removePoint(lastEvent.pointIndex, false);
          this._chart.series[1].addPoint(lastEvent.point, true);
        }
      }
    });
    this._redrawThrottleLast = new Subject<SeriesChangeEvent>();
    this._redrawThrottleLast.pipe(bufferTime(this._redrawThrottlePeriodMs)).subscribe({
      next: (args) => {
        if (args.length > 0 && this._chart !== undefined) {
          const lastEvent = args[args.length - 1];
          this._chart.series[2].removePoint(lastEvent.pointIndex, false);
          this._chart.series[2].addPoint(lastEvent.point, true);
        }
      }
    });

    this._sequencer = new IntervalHistorySequencer();
    this._sequencer.setParameters(IntervalHistorySequencer.UnitId.Millisecond, 60000, true, true);
    // this._sequencer.changeBegunEvent = () => { window.motifLogger.loglog('Seq: Change begun'); }
    // this._sequencer.changeEndedEvent = () => { window.motifLogger.loglog('Seq: Change ended'); }
    this._sequencer.sequencerLoadedEvent = () => {
      /** After Sequencer has finished loading, we know the number of points on the X Axis. It is now necessary to initialise all
       * sequence series with the equivalent number null points.  This ensures that the number of points in the sequencer and the
       * sequence series are the same.
       * (Maybe this should be done automatically in the Sequencer library ???)
       */
      this._ohlc.initialiseWithNullPoints();
      this._volume.initialiseWithNullPoints();
      this._last.initialiseWithNullPoints();
      window.arclightLogger.logDebug('Seq: Loadedd');
    }
    this._sequencer.allEngineSeriesLoadedEvent = () => {
      window.arclightLogger.logDebug(`Seq: All series loaded. Ohlc Point Count: ${this._ohlc.pointCount}  Ready to plot on chart`);
      /** Now ready to do the first plot of points on the chart */

      this.plotChart();
    }

    /** Create a History sequences series which will hold the price series points from the charted LitIvemId.
     * Note that the ancestry for this class is based around whether a series is an Interval or RepeatableExact type series.
     * However normally we are more interested if a series contains OHLC points or number points.
     * That is: OhlcHistorySequenceSeriesInterface or NumberHistorySequenceSeriesInterface.
     * This allows different types of number based HistorySequenceSeries to be treated equally
     * So cast to OhlcHistorySequenceSeriesInterface which supports this type of ancestry
     */
    this._ohlc = new OhlcIntervalHistorySequenceSeries(this._sequencer) as OhlcHistorySequenceSeriesInterface;
    this._ohlc.subscribePointInsertedEvent((idx) => {
      // window.motifLogger.loglog(`OHLC point inserted at ${ idx}`);
      const ohlcPoint = this.createOHLCPoint(this._ohlc.getOhlcPoint(idx), this._ohlc.getSequencerPoint(idx));
      if (ohlcPoint !== undefined)
        this._redrawThrottleOHLC.next({ pointIndex: idx, point: ohlcPoint });
    });
    this._ohlc.subscribePointUpdatedEvent((idx) => {
      // window.motifLogger.loglog(`OHLC point updated at ${ idx}`)
      const ohlcPoint = this.createOHLCPoint(this._ohlc.getOhlcPoint(idx), this._ohlc.getSequencerPoint(idx));
      if (ohlcPoint !== undefined) {
        this._redrawThrottleOHLC.next({ pointIndex: idx, point: ohlcPoint });
      }
    });
    // this._ohlc.subscribePointsInsertedEvent((idx, num) => { window.motifLogger.logDebug(`${num} OHLC points inserted at ${idx}`); });

    this._volume = new AccumulationIntervalHistorySequenceSeries(this._sequencer) as NumberHistorySequenceSeriesInterface
    this._volume.subscribePointInsertedEvent((idx) => {
      if (this._chart !== undefined) {
        // window.motifLogger.loglog(`VOL point inserted at ${ idx}`);
        const volumePoint = this.createNumberPoint(this._volume.getNumberPoint(idx), this._volume.getSequencerPoint(idx));
        this._chart.series[1].addPoint(volumePoint, true);
      }
    });
    this._volume.subscribePointUpdatedEvent((idx) => {
      if (this._chart !== undefined) {
        // window.motifLogger.loglog(`VOL point updated at ${ idx}`)
        const volumePoint = this.createNumberPoint(this._volume.getNumberPoint(idx), this._volume.getSequencerPoint(idx));
        this._chart.series[1].removePoint(idx, false);
        this._chart.series[1].addPoint(volumePoint, true);
      }
    });
    // this._volume.subscribePointsInsertedEvent((idx, num) => { window.motifLogger.logDebug(`${num} VOL points inserted at ${idx}`); });

    this._last = new OhlcIntervalHistorySequenceSeries(this._sequencer) as OhlcHistorySequenceSeriesInterface
    this._last.subscribePointInsertedEvent((idx) => {
      // window.motifLogger.loglog(`VOL point inserted at ${ idx}`);
      const lastPoint = this.createOHLCPoint(this._last.getOhlcPoint(idx), this._last.getSequencerPoint(idx));
      if (lastPoint !== undefined && this._chart !== undefined) {
        this._chart.series[2].addPoint([lastPoint[0], lastPoint[4]], true);
      }
    });
    this._last.subscribePointUpdatedEvent((idx) => {
      // window.motifLogger.loglog(`VOL point updated at ${ idx}`)
      const lastPoint = this.createOHLCPoint(this._last.getOhlcPoint(idx), this._last.getSequencerPoint(idx));
      if (lastPoint !== undefined && this._chart !== undefined) {
        this._chart.series[2].removePoint(idx, false);
        this._chart.series[2].addPoint([lastPoint[0], lastPoint[4]], true);
      }
    });
    // this._last.subscribePointsInsertedEvent((idx, num) => { window.motifLogger.logDebug(`${num} VOL points inserted at ${idx}`); });

    addIcons({
      constructSharp,
    })
  }

  public get waitingToLoad(): boolean {
    return (!this._chart);
  }

  override ngOnDestroy() {
    super.ngOnDestroy()

    this.checkUnsubscribeToChartData();
  }

  ngAfterViewInit(): void {
    this.subscribeToChartData();
  }

  public presentChartOptionsModal() {
    window.arclightLogger.logDebug('Display chart options')
  }

  private subscribeToChartData() {
    if (this._dataIvemId === undefined)
      return;

    /** Create history for a LitIvemId
     * A LitIvemId history can have 2 types of series: Price and Volume
     */
    this._historySource = new DataIvemIdPriceVolumeSequenceHistory(this._unifySvc.decimalFactory, this._unifySvc.symbolsService, this._unifySvc.adi, this._dataIvemId);
    this._historySource.badnessChangedEvent = () => this.handleBadnessChanged();
    this._historySource.allSeriesLoadedChangedEvent = () => this.handleAllSeriesLoaded();
    this._historySource.becameUsableEvent = () => this.handlerBecomeUsable();

    /** Add all histories (in this case only 1) to the sequencer.  The sequencer will ensure that the points from all histories
     * are correctly placed on the X Axis
     */
    this._sequencer.beginHistoriesChange();
    try {
      /** Register the sequence series which will be used to plot data with the history.
       * Note that more than sequence series can be registered for either the history's price or volume series. This allows (for example)
       * both an OHLC sequence series and a number sequence series to be registered for price.  So a chart can simultaneously show
       * a candle and a line plot showing price
       */
      this._historySource.registerSeries(this._ohlc, DataIvemIdPriceVolumeSequenceHistory.SeriesTypeId.Price);
      this._historySource.registerSeries(this._volume, DataIvemIdPriceVolumeSequenceHistory.SeriesTypeId.Volume);
      this._historySource.registerSeries(this._last, DataIvemIdPriceVolumeSequenceHistory.SeriesTypeId.Price);

      /** Assign the history to a sequencer.  The sequencer represents the X Axis.  You can assign multiple histories to the sequencer
       * allowing you to include multiple securities on the one chart.  The sequencer will ensure that the points are correctly
       * distributed along the X-Axis
       */
      this._historySource.setSequencer(this._sequencer);
    } finally {
      this._sequencer.endHistoriesChange();
    }

    /** Activate all the histories after the series have been registered to them and they have been assigned to a sequencer.
     * When activated, a history will subscribe to its relevant data items, collect data and start adding the data to its sequencer
     * and registered series.  Events will start to fire on the sequencers and sequencer series accordingly
    */
    this._sequencer.beginHistoriesChange();
    try {
      this._historySource.activate(this._dataIvemId);
    } finally {
      this._sequencer.endHistoriesChange();
    }
  }

  private checkUnsubscribeToChartData(): void {
    if (this._historySource) {
      this._historySource.deactivate();
    }
  }

  private handleBadnessChanged(): void {
    /** Badness should only be used to display the status of chart.  It should not be involved in the chart plot drawing logic */
    window.arclightLogger.logDebug(`Chart badness: ${ Badness.generateText(this._historySource?.badness ?? Badness.inactive)}`);
    // if (this._di.badness.reasonId === Badness.ReasonId.NotBad) {

    //   window.motifLogger.loglog(`Point-count: ${ this._sequencer.pointCount}`);
    //   window.motifLogger.loglog(`OHLC point-count: ${ this._ohlc.pointCount}`)

    //   for (let i = 0; i < this._ohlc.pointCount; i++) {
    //     let pt = this._ohlc.getOhlcPoint(i);
    //     window.motifLogger.loglog(`Pt: ${ pt}`);
    //   }
    // }
  }

  private handleAllSeriesLoaded(): void {
    window.arclightLogger.logDebug('Chart series loaded');
  }

  private handlerBecomeUsable(): void {
    window.arclightLogger.logDebug(`Chart usable: ${ this._historySource?.usable}`);
  }

  private calcPlotDate(dt: SourceTzOffsetDateTime, tz: SourceTzOffsetDateTime.TimezoneModeId): number {
    const ticks = SourceTzOffsetDateTimeExt.getAdjustedDate(dt, tz).getTime();
    return ticks;
  }

  private createOHLCPoint(pt: OhlcHistorySequenceSeriesInterface.Point, tm: SourceTzOffsetDateTime) {
    if (pt.close === 0) return undefined;
    const when = this.calcPlotDate(tm, this._displayTZ);
    return [when, pt.open, pt.high, pt.low, pt.close];
  }

  private createNumberPoint(pt: NumberHistorySequenceSeriesInterface.Point, tm: SourceTzOffsetDateTime) {
    const when = this.calcPlotDate(tm, this._displayTZ);
    return [when, pt.value];
  }

  private plotChart() {
    const ohlcSeries = [];
    const volumeSeries = [];
    const lastSeries = [];
    for (let loop = 0; loop < this._ohlc.pointCount; loop++) {
      const ohlcPoint = this.createOHLCPoint(this._ohlc.getOhlcPoint(loop), this._ohlc.getSequencerPoint(loop));
      if (ohlcPoint !== undefined) {
        ohlcSeries.push(ohlcPoint);
        lastSeries.push([ohlcPoint[0], ohlcPoint[4]]);
      }
      const volumePoint = this.createNumberPoint(this._volume.getNumberPoint(loop), this._volume.getSequencerPoint(loop));
      volumeSeries.push(volumePoint);
    }
    // let maxVol = volumeSeries.reduce((pre, cur) => { return Math.max(pre, cur[1]) }, 0);

    const options: Highcharts.Options = {
      chart: {
        spacingBottom: 4,
        spacingLeft: 8,
        spacingRight: 8,
        spacingTop: -8,
        marginBottom: 8,
        marginLeft: 16,
        marginRight: 16,
        marginTop: 4,
        // styledMode: true,
      },
      title: {
        text: ''
      },
      legend: {
        enabled: false
      },
      yAxis: [{
        opposite: false,
        title: {
          text: ''
        },
        maxPadding: 0.1,
        minPadding: 0.2,
        offset: 0,
        labels: {
          align: 'left',
          x: 4
        },
        lineWidth: 2,
      }, {
        opposite: true,
        title: {
          text: ''
        },
        maxPadding: 3,
        offset: 0,
        labels: {
          align: 'right',
          x: -16,
        },
        lineWidth: 2,
        gridLineWidth: 0
      }, {
        opposite: false,
        title: {
          text: ''
        },
        maxPadding: 0.1,
        minPadding: 0.2,
        offset: 0,
        labels: {
          enabled: false,
        },
        lineWidth: 2,
      }],
      series: [{
        type: 'candlestick',
        name: 'OHLC',
        data: ohlcSeries,
        colorIndex: this.colorindex_OHLC
      },
      {
        type: 'column',
        name: 'Volume',
        data: volumeSeries,
        yAxis: 1,
        colorIndex: this.colorIndex_Volume,
      }, {
        type: 'spline',
        name: 'Last',
        data: lastSeries,
        // yAxis: 2,
        colorIndex: this.colorIndex_Last,

      }],
      time: {
        timezoneOffset: 0  // don't allow Highcharts to adjust date. Push date in nominated TZ (utc, local, source)
      },
      rangeSelector: {
        // enabled: false,
        buttons: [{
          type: 'day',
          count: 1,
          text: 'Day',
          title: 'View all day'
        }, {
          type: 'hour',
          count: 2,
          text: '2hr',
          title: 'View last 2 hours'
        }, {
          type: 'hour',
          count: 1,
          text: '1hr',
          title: 'View last hours'
        }, {
          type: 'minute',
          count: 30,
          text: '30min',
          title: 'View last 30 minutes'
        }],
        // selected: 1,
        allButtonsEnabled: true,
      },
      scrollbar: {
        enabled: false
      },
      tooltip: {
        followTouchMove: false, // to allow for one finger panning, pinch zoom
      },
      credits: {
        enabled: false
      }
    };

    switch (this._themeSvc.theme) {
      case "light":
        this.chartPlaceholder.nativeElement.classList.add('highcharts-light');
        break;
      case "dark":
        this.chartPlaceholder.nativeElement.classList.add('highcharts-dark');
        break;
    }

    // eslint-disable-next-line import-x/namespace
    this._chart = Highcharts.stockChart(this.chartPlaceholder.nativeElement, options);

    // if (this._ohlc.pointCount > 30) {
    //   const endTime = this.calcPlotDate(this._ohlc.getSequencerPoint(this._ohlc.pointCount - 1), this.displayTZ);
    //   const startTime = endTime - (30 * 60 * 1000);
    //   this._chart.axes[0].setExtremes(startTime, endTime, true);
    // }
  }
}

class SeriesChangeEvent {
  public pointIndex = 0;
  public point: number[] = [];
}

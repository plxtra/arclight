import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  SegmentCustomEvent,
  ViewDidEnter,
} from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { SearchSymbolsDataDefinition, SymbolFieldId, SymbolsDataItem } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { SymbolSearchTransferModel } from '../../models/transfer/symbol-search.transfermodel';
import { SymbolSearchViewModel } from '../../models/view/symbol-search.viewmodel';
import { zstring, zSymbolsDataItem } from '../../types/nullable-types';

@Component({
  selector: 'app-symbol-search',
  templateUrl: './symbol-search.page.html',
  styleUrls: ['./symbol-search.page.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonImg,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
    IonInput,
  ],
})
export class SymbolSearchPageComponent implements OnInit, OnDestroy, ViewDidEnter {
  @ViewChild("searchFor") searchFor: IonInput;

  public searchText: zstring;
  public dataAvailable = false;

  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private _modalController: ModalController;

  private _searchSymbolsDI: zSymbolsDataItem;
  private _viewData: SymbolSearchViewModel[] = [];
  private _subidEndChanges: MultiEvent.SubscriptionId;

  private _skeletonList: SymbolSearchViewModel.Skeleton[];
  private _searchBy: SearchSymbolsDataDefinition.Condition.MatchId = SearchSymbolsDataDefinition.Condition.MatchId.fromStart;

  private _searched = false;

  constructor() {
    const modalController = inject(ModalController);
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._modalController = modalController;

    this._skeletonList = [];

    addIcons({
      close,
    });
  }

  public get searched(): boolean {
    return this._searched;
  }

  public get searchList() {
    if (this.dataAvailable) return this._viewData;
    else return this._skeletonList;
  }

  public get anyResults() {
    if (this.dataAvailable && this._searched)
      return this._viewData.length > 0;
    return true;
  }

  ngOnInit() {
    this.searchText = "";
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromSymbolSearch();
  }

  ionViewDidEnter(): void {
    // Crashes when using optimisation at the following line:
    // https://github.com/ionic-team/ionic-framework/blob/4b5753a4ce69da5cadc2b7ff1d2165bc14274372/packages/angular/common/src/utils/proxy.ts#L26
    // return this.z.runOutsideAngular(() => this.el[methodName].apply(this.el, args));
    const setFocusPromise = this.searchFor.setFocus();
    AssertInternalError.throwErrorIfPromiseRejected(setFocusPromise, 'SSPIVDE20112');
  }

  dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'SSPDM20112');
  }

  selectSymbol(mapKey: string | undefined) {
    if (mapKey !== undefined) { // can be undefined if skeleton list is shown
      const rec = this._searchSymbolsDI?.records.filter(r => r.key.mapKey === mapKey).pop();
      if (rec === undefined) return;
      const modalData = {
        litIvemId: rec.dataIvemId
      } as SymbolSearchTransferModel;
      const dismissPromise = this._modalController.dismiss(modalData);
      AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'SSPSS20112');
    }
  }

  segmentChanged(ev: Event | undefined) {
    if (ev) {
      const evnt = ev as SegmentCustomEvent;
      switch (evnt.detail.value) {
        case "startsWith": this._searchBy = SearchSymbolsDataDefinition.Condition.MatchId.fromStart;
          break;
        case "endsWith": this._searchBy = SearchSymbolsDataDefinition.Condition.MatchId.fromEnd;
          break;
        case "exact":
          this._searchBy = SearchSymbolsDataDefinition.Condition.MatchId.exact;
          break;
      }
    }
  }

  public searchKeypressHandler(keycode: number) {
    if (keycode === 13) this.doSearch();
  }

  public doSearch() {
    this.checkUnsubscribeFromSymbolSearch();
    this._skeletonList = new Array<SymbolSearchViewModel.Skeleton>(5);

    const condition = {
      text: this.searchText,
      fieldIds: [SymbolFieldId.Code, SymbolFieldId.Name],
      isCaseSensitive: false,
      matchIds: [this._searchBy],
    } as SearchSymbolsDataDefinition.Condition;

    const def = new SearchSymbolsDataDefinition(this._unifySvc.decimalFactory);
    def.conditions = [condition];
    this._searchSymbolsDI = this._unifySvc.adi.subscribe(def) as SymbolsDataItem;

    this._subidEndChanges = this._searchSymbolsDI.subscribeEndChangesEvent(() => {
      this.handleSymbolsChanged();
    });

    this.handleSymbolsChanged();
    this._searched = true;
  }

  private handleSymbolsChanged() {
    if (this._searchSymbolsDI === undefined) return;
    this._viewData = this._searchSymbolsDI.records
      .map(r => SymbolSearchViewModel.newFromDI(r, this._bundledSvc))
      .sort((a, b) => a.code.localeCompare(b.code));
    this.dataAvailable = this._searchSymbolsDI.usable;
  }

  private checkUnsubscribeFromSymbolSearch() {
    if (this._searchSymbolsDI !== undefined) {
      this._searchSymbolsDI.unsubscribeEndChangesEvent(this._subidEndChanges);
      this._unifySvc.adi.unsubscribe(this._searchSymbolsDI);
    }
  }
}

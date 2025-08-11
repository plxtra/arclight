import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonBadge, IonCard, IonCardHeader, IonCol, IonGrid, IonLabel, IonRow, IonSkeletonText } from '@ionic/angular/standalone';
import { MultiEvent } from '@pbkware/js-utils';
import { DataIvemId, SecurityDataDefinition, SecurityDataItem } from '@plxtra/motif-core';
import { BundledService } from 'src/app/services/bundled.service';
import { UnifyService } from 'src/app/services/unify.service';
import { SecurityViewModel } from 'src/app/shared/models/view/security.viewmodel';
import { RecentMovement } from '../../shared/types/shared-types';

@Component({
  selector: 'app-standard-security-control',
  templateUrl: './standard-security-control.component.html',
  styleUrls: ['./standard-security-control.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    IonCard,
    IonCardHeader,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonSkeletonText,
    IonBadge,
  ],
})
export class StandardSecurityControlComponent implements OnDestroy {
  @Input() public showCodeNamePrice: boolean;
  @Input() public showAuction: boolean
  @Input() public showExtended: boolean
  @Input() public showBest: boolean;
  @Input() public showOhlc: boolean;

  public dataAvailableSecurity: boolean;


  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private _dataIvemId: DataIvemId;
  private _securityDI: SecurityDataItem | undefined;
  private _subidEndChanges: MultiEvent.SubscriptionId;
  private _subidFieldValuesChanged: MultiEvent.SubscriptionId;
  private _viewData: SecurityViewModel;


  private _securityCode: string;

  constructor() {
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);

    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    // defaults
    this.showCodeNamePrice = true;
    this.showAuction = false;
    this.showExtended = false;
    this.showBest = false;
    this.showOhlc = false;
  }

  @Input()
  public set securityCode(v: string | undefined) {
    if (v && this._securityCode !== v) {
      this._securityCode = v;
      this.checkUnsubscribeFromSecurity();
      const parse = this._unifySvc.parseDataIvemId(this.securityCode);
      if (parse.errorText === undefined) {
        this._dataIvemId = parse.marketIvemId;
        this.subscribeToSecurity();
      }
    }
  }

  public get securityCode(): string {
    return this._securityCode;
  }

  public get securityDetail() {
    if (this.dataAvailableSecurity) return this._viewData;
    else return undefined;
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromSecurity();
  }

  public readLastOrClosedChanged(sec: SecurityViewModel | undefined): RecentMovement {
    if (!sec) return RecentMovement.UNCHANGED;
    if (!sec.lastOrCloseChanged) return RecentMovement.UNCHANGED;
    return sec.lastOrCloseChanged;
  }

  private subscribeToSecurity() {
    const definition = new SecurityDataDefinition(this._dataIvemId.code, this._dataIvemId.marketZenithCode);
    this._securityDI = this._unifySvc.adi.subscribe(definition) as SecurityDataItem;
    this._viewData = new SecurityViewModel(this._bundledSvc, undefined);
    this.loadViewDataSecurity();
    this._subidEndChanges = this._securityDI.subscribeEndChangesEvent((DI) => this.loadViewDataSecurity());
    this._subidFieldValuesChanged = this._securityDI.subscribeFieldValuesChangedEvent((changes) => this._viewData.loadChanges(changes));
  }

  private loadViewDataSecurity() {
    const securityDI = this._securityDI;
    this._viewData.loadFromDI(securityDI);
    this.dataAvailableSecurity = securityDI !== undefined && securityDI.usable;
  }

  private checkUnsubscribeFromSecurity(): void {
    if (this._securityDI !== undefined) {
      this._securityDI.unsubscribeEndChangesEvent(this._subidEndChanges);
      this._securityDI.unsubscribeFieldValuesChangedEvent(this._subidFieldValuesChanged);
      this._unifySvc.adi.unsubscribe(this._securityDI);
    }
  }
}


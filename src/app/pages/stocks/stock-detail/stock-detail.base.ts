import { Directive, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MultiEvent } from '@pbkware/js-utils';
import { SecurityDataDefinition, SecurityDataItem } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { UnifyService } from "src/app/services/unify.service";
import { SecurityViewModel } from "src/app/shared/models/view/security.viewmodel";
import { zDataIvemId, zSecurityDataItem } from "src/app/shared/types/nullable-types";

@Directive()
export abstract class StockDetailBaseDirective implements OnInit, OnDestroy {
  public dataAvailableSecurity = false;

  protected readonly _unifySvc: UnifyService;
  protected readonly _bundledSvc: BundledService;
  protected _dataIvemId: zDataIvemId;
  protected _securityDI: zSecurityDataItem;

  private readonly _route: ActivatedRoute;

  private _subidEndChanges: MultiEvent.SubscriptionId;
  private _subidFieldValuesChanged: MultiEvent.SubscriptionId;
  private _viewData: SecurityViewModel;

  constructor(
    route: ActivatedRoute,
    unifySvc: UnifyService,
    bundledSvc: BundledService
  ) {
    this._route = route;
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._viewData = new SecurityViewModel(this._bundledSvc, undefined);
  }

  public get securityDetail() {
    if (this.dataAvailableSecurity) return this._viewData;
    else return undefined;
  }

  ngOnInit() {
    const id = this._route.snapshot.params.id as string; // params also contains parameters from parent snapshots due to paramsInheritanceStrategy
    const parse = this._unifySvc.parseDataIvemId(id);
    if (parse.errorText === undefined) {
      this._dataIvemId = parse.marketIvemId;
      const definition = new SecurityDataDefinition(this._dataIvemId.code, this._dataIvemId.marketZenithCode);
      this._securityDI = this._unifySvc.adi.subscribe(definition) as SecurityDataItem;
      this._viewData = new SecurityViewModel(this._bundledSvc, undefined);
      this.loadViewDataSecurity();
      this._subidEndChanges = this._securityDI.subscribeEndChangesEvent((DI) => this.loadViewDataSecurity());
      this._subidFieldValuesChanged = this._securityDI.subscribeFieldValuesChangedEvent((changes) => this._viewData.loadChanges(changes));
    }
  }

  ngOnDestroy() {
    this.checkUnsubscribeFromSecurity();
  }

  private loadViewDataSecurity() {
    this._viewData.loadFromDI(this._securityDI);
    this.dataAvailableSecurity = this._securityDI?.usable ?? false;
  }

  private checkUnsubscribeFromSecurity(): void {
    if (this._securityDI !== undefined) {
      this._securityDI.unsubscribeEndChangesEvent(this._subidEndChanges);
      this._securityDI.unsubscribeFieldValuesChangedEvent(this._subidFieldValuesChanged);
      this._unifySvc.adi.unsubscribe(this._securityDI);
    }
  }
}

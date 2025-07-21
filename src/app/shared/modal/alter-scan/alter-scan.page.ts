import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActionSheetButton, ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { DataIvemId, QueryNotificationChannelsDataDefinition, QueryNotificationChannelsDataItem, ScanField, ScanFieldCondition, ScanFormula } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { add, beer, chevronBack, chevronForward, close, construct, glasses, informationCircle, nutrition, pizza, trash } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { ClockService } from 'src/app/services/clock.service';
import { UnifyService } from 'src/app/services/unify.service';
import { MultiSheetTemplateDirective } from 'src/app/templates/multi-sheet.template';
import { ScanSummaryComponent } from '../../../components/scan-summary/scan-summary.component';
import { SelectLocaleComponent } from '../../../components/select-locale/select-locale.component';
import { TraitConditionComponent } from '../../../components/trait-condition/trait-condition.component';
import { ScanEditDataModel } from '../../models/data/scan-edit.datamodel';
import { TraitConditionDataModel } from '../../models/data/trait-condition.datamodel';
import { TraitCriteriaModel } from '../../models/scans/trait-criteria.model';
import { TraitDefinitionModel } from '../../models/scans/trait-definition.model';
import { Incubator } from '../../models/supplementary/incubator';
import { AlterScanTransferModel } from '../../models/transfer/alter-scan.transfermodel';
import { SymbolSearchTransferModel } from '../../models/transfer/symbol-search.transfermodel';
import { NotificationViewModel } from '../../models/view/notification.viewmodel';
import { SelectableEntry } from '../../types/selectable-entry';
import { SymbolSearchPageComponent } from '../symbol-search/symbol-search.page';

@Component({
  selector: 'app-alter-scan',
  templateUrl: './alter-scan.page.html',
  styleUrls: ['./alter-scan.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TraitConditionComponent,
    SelectLocaleComponent,
    ScanSummaryComponent,
  ],
})
export class AlterScanPageComponent extends MultiSheetTemplateDirective implements OnInit, OnDestroy {
  @Input() protected prime: AlterScanTransferModel = {} as AlterScanTransferModel;

  public dataAvailableNotifications = false;

  public readonly OverviewSheet = this.BaseSheetNumber;
  public readonly TargetsSheet = this.BaseSheetNumber + 1;
  public readonly CriteriaSheet = this.BaseSheetNumber + 2;
  public readonly NotificationSheet = this.BaseSheetNumber + 3;
  public readonly ConfirmationSheet = this.BaseSheetNumber + 4;
  // breakouts
  public readonly NotificationSettingsSheet = this.BaseSheetNumber + 10;

  public alteration: "create" | "update" | undefined = undefined;

  private readonly _modalController: ModalController;
  private readonly _actionSheetController: ActionSheetController;
  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _clockSvc: ClockService;

  private _dataModel: ScanEditDataModel;
  private _viewDataNotifications: SelectableEntry<NotificationViewModel>[] = [];

  private _targetTraitConditions: TraitConditionDataModel[] = [];

  constructor() {
    const modalController = inject(ModalController);
    const actionSheetController = inject(ActionSheetController);
    const unifySvc = inject(UnifyService);
    const bundledSvc = inject(BundledService);
    const clockSvc = inject(ClockService);
    const scanEditDatamodel = inject(ScanEditDataModel);

    super();
    this._modalController = modalController;
    this._actionSheetController = actionSheetController;
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._clockSvc = clockSvc;
    this._dataModel = scanEditDatamodel;
    this.initialSheet(this.OverviewSheet);

    addIcons({
      close,
      informationCircle,
      add,
      trash,
      nutrition,
      pizza,
      glasses,
      beer,
      construct,
      chevronForward,
      chevronBack,
    });
  }

  public get doingCreate(): boolean { return (this.alteration === "create"); }
  public get doingUpdate(): boolean { return (this.alteration === "update"); }

  public get anyDataNotifications(): boolean {
    return (this.dataAvailableNotifications && this._viewDataNotifications.length > 0);
  }

  public get dataModel(): ScanEditDataModel {
    return this._dataModel;
  }
  public get viewDataNotifications(): SelectableEntry<NotificationViewModel>[] {
    return this._viewDataNotifications;
  }

  public get targetTraitConditions(): TraitConditionDataModel[] {
    return this._targetTraitConditions;
  }
  public set targetTraitConditions(v: TraitConditionDataModel[]) {
    this._targetTraitConditions = v;
  }

  ngOnInit() {
    const initPromise = this.init();
    AssertInternalError.throwErrorIfPromiseRejected(initPromise, 'ASPCNOI65591');
  }

  ngOnDestroy() {
    this._dataModel.finalise();
  }

  public dismissModal() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPCDM65591');
  }

  public createAndClose() {
    const createScanResultPromise = this.dataModel.scanEditor.createScan();
    createScanResultPromise.then(
      (result) => {
        if (result.isErr()) {
          //
        } else {
          if (result.isOk()) {
            const dismissPromise = this._modalController.dismiss();
            AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPCCACD65591');
          }
        }
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'ASPCCACR65591'); }
    );
  }

  public updateAndClose() {
    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPCUAC65591');
  }

  //********************************************** */

  public removeTargetSymbol(id: DataIvemId) {
    this._dataModel.scanStorage.removeSymbol(id);
  }

  public async addTargetSymbol() {
    // this._dataModel.selectSymbol();
    const modal = await this._modalController.create({
      component: SymbolSearchPageComponent,
      cssClass: 'symbol-search-modal',
      backdropDismiss: false
    });

    const dismissPromise = modal.onDidDismiss();
    dismissPromise.then(
      modalResult => {
        if (modalResult.data) { // not cancelled
          const data = (modalResult.data as SymbolSearchTransferModel);
          const addPromise = this._dataModel.scanStorage.addSymbol(data.litIvemId);
          AssertInternalError.throwErrorIfPromiseRejected(addPromise, 'ASPCATSA65591');
        }
      },
      (reason: unknown) => { AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPCATSD65591'); }
    );

    await modal.present();
  }

  public removeTargetTraitCondition(selectedTraitId: string) {
    const idx = this._targetTraitConditions.findIndex(n => n.fieldId === selectedTraitId);
    if (idx !== -1) {
      this._targetTraitConditions.splice(idx, 1);
    }
  }

  public addTargetTraitCondition(selectedTraitId: string) {
    if (selectedTraitId !== "" && !this._targetTraitConditions.find(n => n.fieldId === selectedTraitId)) {
      const node = {
        fieldId: selectedTraitId,
        fieldDisplay: TraitDefinitionModel.description(selectedTraitId),
        fieldStyle: TraitDefinitionModel.style(selectedTraitId),
        meets: "All",
        criteria: []
      } as TraitConditionDataModel;
      this._targetTraitConditions.push(node);
    }
  }

  public addTraitCriteria(selectedTraitId: string) {
    const idx = this._targetTraitConditions.findIndex(n => n.fieldId === selectedTraitId);
    if (idx !== -1) {
      this._targetTraitConditions[idx].criteria.push(({} as TraitCriteriaModel));
    }
  }

  public async presentAddTrait() {
    const traitButtons: ActionSheetButton[] = [{
      text: 'Cancel',
      role: 'cancel',
      data: {},
    }];
    traitButtons.push(...TraitDefinitionModel.listOfKeys().map(k => {
      return { text: TraitDefinitionModel.description(k), data: { traitId: k } }
    }));
    const actionSheet = await this._actionSheetController.create({
      header: 'Traits',
      subHeader: 'Choose a trait to add',
      cssClass: 'standard-action-sheet',
      buttons: traitButtons,
    });

    const dismissPromise = actionSheet.onDidDismiss();
    dismissPromise.then(
      modalResult => {
        if (modalResult.data) { // not cancelled
          // return data
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const id = modalResult.data.traitId as string;
          this.addTargetTraitCondition(id);
        }
      },
      (reason: unknown) => { AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ASPCATSD65591'); }
    );

    await actionSheet.present();
  }

  public wildOperation(num: number) {
    switch (num) {
      case 1: {
        const sf1 = this._dataModel.scanStorage.traits.constructTrait(ScanFormula.FieldId.LastPrice);
        if (sf1.isOk()) {
          const trait = sf1.value;
          trait.conditionsOperationId = ScanField.BooleanOperationId.Or;
          const cnd1 = this._dataModel.scanStorage.traits.conditionFactory.createNumericComparisonWithValue(trait, ScanFieldCondition.OperatorId.Equals, 1);
          const cnd2 = this._dataModel.scanStorage.traits.conditionFactory.createNumericComparisonWithValue(trait, ScanFieldCondition.OperatorId.GreaterThan, 3);
          if (cnd1.isOk() && cnd2.isOk()) {
            trait.conditions.add(cnd1.value);
            trait.conditions.add(cnd2.value);

            this._dataModel.scanStorage.traits.addTrait(trait);
          }
        }
        break;
      }
      case 2: {
        const sf2 = this._dataModel.scanStorage.traits.constructTrait(ScanFormula.FieldId.Code);
        if (sf2.isOk()) {
          const trait = sf2.value;
          const cnd1 = this._dataModel.scanStorage.traits.conditionFactory.createTextContains(trait, ScanFieldCondition.OperatorId.Contains, "ABC", ScanFormula.TextContainsAsId.FromStart, true);
          if (cnd1.isOk()) {
            trait.conditions.add(cnd1.value);

            this._dataModel.scanStorage.traits.addTrait(trait);
          }
        }
        break;
      }
      case 3:  {
        const sf3 = this._dataModel.scanStorage.traits.constructTrait(ScanFormula.FieldId.BestBidCount);
        if (sf3.isOk()) {
          const trait = sf3.value;
          const cnd1 = this._dataModel.scanStorage.traits.conditionFactory.createNumericComparisonWithValue(trait, ScanFieldCondition.OperatorId.GreaterThanOrEqual, 15);
          if (cnd1.isOk()) {
            trait.conditions.add(cnd1.value);

            this._dataModel.scanStorage.traits.addTrait(trait);
          }
        }
        break;
      }
    }

    const crit = this._dataModel.scanEditor.criteriaAsZenithText;
    alert(crit);
    window.arclightLogger.logDebug(`WILD: ${crit}`);
  }

  protected override sheetChanging(fromSheet: number, toSheet: number) {
    switch (fromSheet) {
      case this.TargetsSheet:
        if (this.dataModel.scanStorage.isTargetMarkets) {
          //
        }
    }
    switch (toSheet) {
      case this.TargetsSheet:
        if (this.dataModel.scanStorage.isTargetSymbols) {
          // setFocus somehow to #symbolInput
        }
    }
  }

  private async init() {
    if (this.prime.scanId === "") {
      this.alteration = "create";
    } else if (this.prime.scanId !== "") {
      this.alteration = "update";
    } else {
      throw new AssertInternalError('ASPCDI65591', "Alter action cannot be determined");
    }

    await this._dataModel.initialise(this.prime.scanId);
    await this.queryNotifications();

    this.initialisationDone("popup: alter-scan");
  }

  private async queryNotifications() {
    const def = new QueryNotificationChannelsDataDefinition();
    const incubator = new Incubator<QueryNotificationChannelsDataItem>(this._unifySvc, def);
    try {
      const di = await incubator.incubate();
      if (di !== undefined) {
        if (di.error) {
          throw Error(di.errorText);
        } else {
          this.dataAvailableNotifications = di.usable;
          this._viewDataNotifications = di.notificationChannels
            .map(n => NotificationViewModel.newFromDI(n, this._bundledSvc))
            .map(vm => new SelectableEntry<NotificationViewModel>(vm, false));
        }
      }
    } finally {
      incubator.finalise();
    }
  }

}

// Thanks:
// https://ux.stackexchange.com/a/106706

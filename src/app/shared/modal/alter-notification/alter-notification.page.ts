
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { CreateNotificationChannelDataDefinition, CreateNotificationChannelDataItem, NotificationDistributionMethodId, QueryNotificationChannelDataDefinition, QueryNotificationChannelDataItem, QueryNotificationDistributionMethodsDataDefinition, QueryNotificationDistributionMethodsDataItem, ZenithProtocolCommon } from '@plxtra/motif-core';
import { addIcons } from 'ionicons';
import { alertCircleOutline, chevronBack, chevronForward, close, ellipse, search, trash, trashOutline, warningOutline } from 'ionicons/icons';
import { BundledService } from 'src/app/services/bundled.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { DeviceInformationService } from 'src/app/services/device-information.service';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { UnifyService } from 'src/app/services/unify.service';
import { FormTemplateDirective } from 'src/app/templates/form.template';
import { EmailChannelSettings } from '../../models/supplementary/email-channel.settings';
import { Incubator } from '../../models/supplementary/incubator';
import { AlterNotificationTransferModel } from '../../models/transfer/alter-notification.transfermodel';
import { NotificationUpdateResponseTransferModel } from '../../models/transfer/notification-update-response.transfermodel';
import { DistributionMethodViewModel } from '../../models/view/distribution-method.viewmodel';
import { Alteration, FieldDefinition } from '../../types/field-management.types';

@Component({
  selector: 'app-alter-notification',
  templateUrl: './alter-notification.page.html',
  styleUrls: ['./alter-notification.page.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ],
})
export class AlterNotificationPageComponent extends FormTemplateDirective implements OnInit, OnDestroy {
  @Input() protected prime: AlterNotificationTransferModel = {} as AlterNotificationTransferModel;

  public dataAvailableDistributions = false;
  public dataAvailableChannel = false;

  public readonly MainSheet = this.BaseSheetNumber;
  public readonly MethodSheet = this.BaseSheetNumber + 1;

  private readonly _modalController: ModalController;
  private readonly _actionSheetController: ActionSheetController;
  private readonly _unifySvc: UnifyService;
  private readonly _bundledSvc: BundledService;
  private readonly _configSvc: ConfigurationService;
  private readonly _deviceInfoService: DeviceInformationService;
  private readonly _pushNotificationSvc: PushNotificationService;

  private _distributionsDI: QueryNotificationDistributionMethodsDataItem | undefined;
  private _subidDistributionsCorrectnessChange: MultiEvent.SubscriptionId;
  private _subidDistributionsEndChanges: MultiEvent.SubscriptionId;

  private _targetChannelDI: QueryNotificationChannelDataItem | undefined;
  private _subidChannelCorrectnessChange: MultiEvent.SubscriptionId;

  private _extraEmailAddressField: FieldDefinition;
  private _extraEmailRecipientField: FieldDefinition;

  private _deviceName: string;

  private _viewDataDistributions: DistributionMethodViewModel[] = [];

  private _viewDataAvailableDataDistributions: DistributionMethodViewModel[] = [];

  private _selectedDistribution: DistributionMethodViewModel | undefined;

  constructor(
    modalController: ModalController,
    actionSheetController: ActionSheetController,
    unifySvc: UnifyService,
    bundledSvc: BundledService,
    configSvc: ConfigurationService,
    deviceInfoSvc: DeviceInformationService,
    pushNotificationSvc: PushNotificationService,
  ) {
    super();
    this._modalController = modalController;
    this._actionSheetController = actionSheetController;
    this._unifySvc = unifySvc;
    this._bundledSvc = bundledSvc;
    this._configSvc = configSvc;
    this._deviceInfoService = deviceInfoSvc;
    this._pushNotificationSvc = pushNotificationSvc;

    this.initialSheet(this.MainSheet);

    addIcons({
      close,
      search,
      alertCircleOutline,
      chevronBack,
      ellipse,
      warningOutline,
      trashOutline,
      chevronForward,
      trash,
    });
  }

  public get deviceName(): string { return this._deviceName; }
  public get viewDataAvailableDataDistributions(): DistributionMethodViewModel[] { return this._viewDataAvailableDataDistributions; }
  public get viewDataDistributions(): DistributionMethodViewModel[] { return this._viewDataDistributions; }
  public get anyDataAvailableDistributionMethods(): boolean {
    return (this.dataAvailableDistributions && this._viewDataAvailableDataDistributions.length > 0);
  }

  public get selectedDistribution(): DistributionMethodViewModel | undefined {
    return this._selectedDistribution;
  }
  public set selectedDistribution(v: DistributionMethodViewModel | undefined) {
    if (this._selectedDistribution !== v) {
      this._selectedDistribution = v;
    }
  }

  public override get doingCreate(): boolean { return (this.alteration === "create"); }
  public override get doingUpdate(): boolean { return (this.alteration === "update"); }
  public override get doingDelete(): boolean { return (this.alteration === "delete"); }

  override ngOnInit() {
    super.ngOnInit();

    this._deviceName = `${this._deviceInfoService.deviceInfo.browserName} on ${this._deviceInfoService.deviceInfo.deviceName}`;
    this.queryDistributions();
    this.queryChannel();

    this.initialisationDone("popup: alter-notification");
  }

  ngOnDestroy() {
    this.releaseDistributions();
  }

  public dismissModal() {
    const promise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(promise, 'ANPC30111');
  }

  public chooseDistributionMethod() {
    if (this.doingCreate || this.doingUpdate) {
      this.gotoSheet(this.MethodSheet);
    }
  }

  public selectDistributionMethodAndMain(id: NotificationDistributionMethodId) {
    this.selectDistributionMethod(id);
    this.gotoSheet(this.MainSheet);
  }

  public createAndClose() {
    this.clearSaveErrors();

    if (!this.ionicForm.valid) {
      this.addSaveError('Form has invalid fields. Please provide all the required information.');
      return;
    }

    const frmDistributionMethod = this.ionicForm.get('distributionMethod')?.value as NotificationDistributionMethodId;
    const frmName = this.ionicForm.get('name')?.value as string;
    const frmDescription = this.ionicForm.get('description')?.value as string;
    const frmEnabled = this.ionicForm.get('enabled')?.value as boolean;

    const def = new CreateNotificationChannelDataDefinition();
    def.distributionMethodId = frmDistributionMethod;
    def.notificationChannelName = frmName;
    def.notificationChannelDescription = frmDescription;
    def.enabled = frmEnabled;
    def.userMetadata = this.buildChannelMetadata(frmDistributionMethod);
    def.settings = this.buildChannelSettings(frmDistributionMethod);

    const incubateAndClosePromise = this.incubateAndClose(def);
    AssertInternalError.throwErrorIfPromiseRejected(incubateAndClosePromise, 'ANPCAC20011');
  }

  public updateAndClose() {
    this.clearSaveErrors();

    if (!this.ionicForm.valid) {
      this.addSaveError('Form has invalid fields. Please provide all the required information.');
      return;
    }

    // const def3 = new UpdateNotificationChannelDataDefinition();

    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ANPCUAC30123');
  }

  public deleteAndClose() {
    this.clearSaveErrors();

    if (!this.ionicForm.valid) {
      this.addSaveError('Form has invalid fields. Please provide all the required information.');
      return;
    }
    // const def2 = new DeleteNotificationChannelDataDefinition();


    const dismissPromise = this._modalController.dismiss();
    AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ANPCUAC30123');
  }

  protected override sheetChanging(fromSheet: number, toSheet: number) {
    // switch (toSheet) {
    // }
  }

  protected override sheetChanged(fromSheet: number, toSheet: number) {
    switch (toSheet) {
      case this.MainSheet:
        this.arrangeMainSheet();
        break;
    }
  }

  protected resolveAlteration(): Alteration | undefined {
    if (this.prime.channelId === "") return "create";

    if (this.prime.channelId !== "") {
      if (this.prime.deleting) return "delete"
      else return "update";
    }
    return undefined;
  }

  protected resolveInputFields(): void {
    this._extraEmailAddressField = {
      id: 'emailaddress',
      type: 'Text',
      label: 'Email',
      placeholder: 'Email address',
      validators: [(control) => Validators.required(control), (control) => Validators.email(control)],
      visible: false,
      enabled: false,
    };
    this._extraEmailRecipientField = {
      id: 'emailrecipient',
      type: 'Text',
      label: 'Recipient name',
      placeholder: 'Name of email recipient',
      validators: [],
      visible: false,
      enabled: false,
    };

    this.inputFields.push({
      id: 'id',
      type: 'Text',
      label: 'Id',
      placeholder: 'NotificationId',
      validators: [],
      visible: false,
      enabled: true,
    }, {
      id: 'distributionMethod',
      type: 'Text',
      label: 'Distribution method',
      placeholder: 'Select a method of notification',
      validators: [(control) => Validators.required(control)],
      visible: false,
      enabled: true,
    }, {
      id: 'name',
      type: 'Text',
      label: 'Name',
      placeholder: 'Name of notification',
      validators: [(control) => Validators.required(control)],
      visible: true,
      enabled: true,
    }, {
      id: 'description',
      type: 'Text',
      label: 'Description',
      placeholder: 'Describe the notification method',
      validators: [],
      visible: true,
      enabled: true,
    }, {
      id: 'enabled',
      type: 'Flag',
      label: 'Enabled',
      placeholder: '',
      validators: [(control) => Validators.required(control)],
      visible: true,
      enabled: true,
    },
      this._extraEmailAddressField,
      this._extraEmailRecipientField,
    );
  }

  protected resolveValidations(): void {
    if (this.doingUpdate || this.doingDelete) {
      this.validations.push(
        { fieldId: 'id', type: 'required', message: 'ID is required.' },
      );
    }
    this.validations.push(
      { fieldId: 'distributionMethod', type: 'required', message: 'Distribution method is required.' },
      { fieldId: 'name', type: 'required', message: 'You must provide a name' },
      { fieldId: 'emailaddress', type: 'required', message: 'You must provide an email address' },
      { fieldId: 'emailaddress', type: 'email', message: 'Email address is invalid' },
    );
  }

  protected resolveFieldValues(): void {
    if (this.doingUpdate || this.doingDelete) {
      //
    } else {
      // defaults
      this.ionicForm.get("enabled")?.setValue(true);
    }
  }

  private queryChannel() {
    if (this.doingUpdate || this.doingDelete) {
      this.releaseChannel();
      const def = new QueryNotificationChannelDataDefinition();
      def.notificationChannelId = this.prime.channelId;
      this._targetChannelDI = this._unifySvc.adi.subscribe(def) as QueryNotificationChannelDataItem;
      this._subidChannelCorrectnessChange = this._targetChannelDI.subscribeCorrectnessChangedEvent(() => this.loadChannelIsUsable());
      this.loadChannelIsUsable();
    } else {
      this.dataAvailableChannel = true;
    }
  }

  private releaseChannel() {
    if (this._targetChannelDI !== undefined) {
      this._targetChannelDI.unsubscribeCorrectnessChangedEvent(this._subidChannelCorrectnessChange);
      this._unifySvc.adi.unsubscribe(this._targetChannelDI);
      this._targetChannelDI = undefined;
    }
  }

  private queryDistributions() {
    this.releaseDistributions();
    const definition = new QueryNotificationDistributionMethodsDataDefinition();
    this._distributionsDI = this._unifySvc.adi.subscribe(definition) as QueryNotificationDistributionMethodsDataItem;

    this._subidDistributionsCorrectnessChange = this._distributionsDI.subscribeCorrectnessChangedEvent(() => this.loadDistributionsIsUsable());
    this._subidDistributionsEndChanges = this._distributionsDI.subscribeEndChangesEvent(() => this.loadDistributions());

    this.loadDistributionsIsUsable()
    this.loadDistributions();
  }

  private releaseDistributions() {
    this._viewDataDistributions = [];
    if (this._distributionsDI !== undefined) {
      this._distributionsDI.unsubscribeCorrectnessChangedEvent(this._subidDistributionsCorrectnessChange);
      this._distributionsDI.unsubscribeEndChangesEvent(this._subidDistributionsEndChanges);
      this._unifySvc.adi.unsubscribe(this._distributionsDI);
      this._distributionsDI = undefined;
    }
  }

  private loadDistributions() {
    if (this._distributionsDI === undefined) {
      throw new AssertInternalError('ANPC30112');
    } else {
      if (this._distributionsDI.usable) {
        this._viewDataDistributions = this._distributionsDI.methodIds.map(n => DistributionMethodViewModel.newFromId(n));
        this._viewDataAvailableDataDistributions = this._distributionsDI.methodIds
          .filter(n => !this._configSvc.config.capabilities.inactiveDistributionMethods.includes(n))
          .filter(n => n !== NotificationDistributionMethodId.WebPush || (this._pushNotificationSvc.pushStatus === "Registered"))
          .map(n => DistributionMethodViewModel.newFromId(n));
      }
    }
  }

  private loadDistributionsIsUsable() {
    this.dataAvailableDistributions = this._distributionsDI !== undefined && this._distributionsDI.usable;
  }

  private loadChannelIsUsable() {
    if (this._targetChannelDI === undefined) {
      throw new AssertInternalError('ANPLDIU50022');
    } else {
      if (this._targetChannelDI.usable) {
        this.prefillFormData(this._targetChannelDI);
      }
      this.dataAvailableChannel = this._targetChannelDI.usable;
    }
  }

  private prefillFormData(target: QueryNotificationChannelDataItem) {
    if (this.doingUpdate || this.doingDelete) {
      this.selectDistributionMethod(target.notificationChannelStateAndSettings.distributionMethodId);

      const nameControl = this.ionicForm.get('name');
      if (nameControl === null) {
        throw new AssertInternalError('ANPCPFN50011');
      } else {
        nameControl.setValue(target.notificationChannelStateAndSettings.channelName);
      }
      const descriptionControl = this.ionicForm.get('description');
      if (descriptionControl === null) {
        throw new AssertInternalError('ANPCPFD50012');
      } else {
        descriptionControl.setValue(target.notificationChannelStateAndSettings.channelDescription);
      }
      const enabledControl = this.ionicForm.get('enabled');
      if (enabledControl === null) {
        throw new AssertInternalError('ANPCPFE50012');
      } else {
        enabledControl.setValue(target.notificationChannelStateAndSettings.enabled);
      }
    }
  }

  private selectDistributionMethod(id: NotificationDistributionMethodId) {
    this.selectedDistribution = DistributionMethodViewModel.newFromId(id);
    const distributionMethodControl = this.ionicForm.get('distributionMethod');
    if (distributionMethodControl === null) {
      throw new AssertInternalError('ANPCSDM50011');
    } else {
      distributionMethodControl.setValue(this._selectedDistribution?.id);
    }
  }

  private arrangeMainSheet() {
    // Email
    this._extraEmailAddressField.visible = (this.selectedDistribution?.id === NotificationDistributionMethodId.Email);
    this._extraEmailRecipientField.visible = (this.selectedDistribution?.id === NotificationDistributionMethodId.Email);
    if (this.selectedDistribution?.id === NotificationDistributionMethodId.Email) {
      const emailaddressControl = this.ionicForm.get('emailaddress');
      if (emailaddressControl === null) {
        throw new AssertInternalError('ANPAMSEAE60011');
      } else {
        emailaddressControl.enable();
      }
      const emailrecipientControl = this.ionicForm.get('emailrecipient');
      if (emailrecipientControl === null) {
        throw new AssertInternalError('ANPAMSERC60011');
      } else {
        emailrecipientControl.enable();
      }
    } else {
      const emailaddressControl = this.ionicForm.get('emailaddress');
      if (emailaddressControl === null) {
        throw new AssertInternalError('ANPAMSEACD60011');
      } else {
        emailaddressControl.disable();
      }
      const emailrecipientControl = this.ionicForm.get('emailrecipient');
      if (emailrecipientControl === null) {
        throw new AssertInternalError('ANPAMSERCD60011');
      } else {
        emailrecipientControl.disable();
      }
    }

    // web push
    if (this.selectedDistribution?.id === NotificationDistributionMethodId.WebPush) {
      const nameControl = this.ionicForm.get("name");
      if (nameControl !== null) {
        const currentName = nameControl.value as string | undefined;
        if (!currentName || currentName === '') {
          this.ionicForm.get('name')?.setValue(this._deviceName);
        }
      }
    }

    this.ionicForm.updateValueAndValidity();
  }

  private buildChannelSettings(id: NotificationDistributionMethodId): ZenithProtocolCommon.NotificationChannelSettings {
    switch (id) {
      case NotificationDistributionMethodId.WebPush:
        return {
          endpoint: this._pushNotificationSvc.endPoint,
          expirationTime: this._pushNotificationSvc.expirationTime,
          keys: {
            p256dh: this._pushNotificationSvc.p256dh,
            auth: this._pushNotificationSvc.auth,
          }
        } as ZenithProtocolCommon.WebNotificationChannelSettings;
      case NotificationDistributionMethodId.Email:
        return {
          email: this.ionicForm.get('emailaddress')?.value as string,
          name: this.ionicForm.get('emailrecipient')?.value as string,
        } as EmailChannelSettings
      default:
        return {};
    }
  }

  private buildChannelMetadata(id: NotificationDistributionMethodId): ZenithProtocolCommon.UserMetadata {
    switch (id) {
      case NotificationDistributionMethodId.WebPush:
        return {
          "userVisibleOnly": "true",
          "applicationServerKey": this._configSvc.config.endpoints.notificationServerPublicKey
        } as ZenithProtocolCommon.UserMetadata
      default:
        return {};
    }
  }

  private async incubateAndClose(def: CreateNotificationChannelDataDefinition): Promise<void> {
    const incubator = new Incubator<CreateNotificationChannelDataItem>(this._unifySvc, def);
    try {
      const di = await incubator.incubate();
      if (di !== undefined) {
        if (di.error) {
          this.saveErrors.push(di.errorText);
        } else if (di.usable) {
          const resp = {
            channelId: di.notificationChannelId,
            deleted: false,
          } as NotificationUpdateResponseTransferModel;
          const dismissPromise = this._modalController.dismiss(resp);
          AssertInternalError.throwErrorIfPromiseRejected(dismissPromise, 'ANPCUAC30123');
        }
      }
    } finally {
      incubator.finalise();
    }
  }
}

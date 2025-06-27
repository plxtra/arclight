import { NotificationChannel, NotificationDistributionMethodId } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { NotificationLookups } from "../supplementary/notification.lookups";
import { BaseViewModel } from "./base.viewmodel";

export class NotificationViewModel extends BaseViewModel {
  public id: string;
  public type: string;
  public name: string;
  public description: string;
  public status: string;
  public enabled: boolean;
  public faulted: boolean;
  public metadata: string;
  public settings: string;

  private _iconName: string;
  private _methodId: NotificationDistributionMethodId;

  public get iconName(): string {
    return this._iconName;
  }

  private set methodId(v: NotificationDistributionMethodId) {
    this._methodId = v;
    switch (this._methodId) {
      case NotificationDistributionMethodId.ApplePush:
        this._iconName = "logo-apple";
        break;
      case NotificationDistributionMethodId.Email:
        this._iconName = "mail-outline";
        break;
      case NotificationDistributionMethodId.Debug:
        this._iconName = "bug-outline";
        break;
      case NotificationDistributionMethodId.GooglePush:
        this._iconName = "logo-google";
        break;
      case NotificationDistributionMethodId.Sms:
        this._iconName = "phone-portrait-outline";
        break;
      case NotificationDistributionMethodId.WebPush:
        this._iconName = "globe-outline";
        break;
    }
  }

  static newFromDI(di: NotificationChannel, bundledSvc: BundledService): NotificationViewModel {
    const model = new NotificationViewModel(bundledSvc);
    model.loadFromDI(di);
    return model;
  }

  public loadFromDI(di: NotificationChannel) {
    this.methodId = di.distributionMethodId;

    this.id = di.channelId;
    this.type = NotificationLookups.methodIdtoDisplay(di.distributionMethodId);
    this.name = di.channelName;
    this.description = di.channelDescription ?? '';
    this.status = NotificationLookups.statusIdToDisplay(di.channelStatusId);
    this.enabled = di.enabled;
    this.faulted = di.faulted;
    this.metadata = JSON.stringify(di.userMetadata, null, 2);
    this.settings = JSON.stringify(di.settings, null, 2);
  }
}

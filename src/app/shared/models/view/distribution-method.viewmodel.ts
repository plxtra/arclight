import { NotificationDistributionMethodId } from "@plxtra/motif-core";
import { zstring } from "../../types/nullable-types";
import { NotificationLookups } from "../supplementary/notification.lookups";

export class DistributionMethodViewModel {
  public id: NotificationDistributionMethodId;
  public display: zstring;

  public static newFromId(id: NotificationDistributionMethodId): DistributionMethodViewModel {
    const model = new DistributionMethodViewModel();
    model.loadFromId(id);
    return model;
  }

  public loadFromId(id: NotificationDistributionMethodId) {
    this.id = id;
    this.display = NotificationLookups.methodIdtoDisplay(id);
  }
}

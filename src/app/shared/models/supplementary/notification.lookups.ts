import { ActiveFaultedStatusId, NotificationDistributionMethodId } from "@plxtra/motif-core";

export namespace NotificationLookups {
  export function methodIdtoDisplay(mi: NotificationDistributionMethodId): string {
    switch (mi) {
      case NotificationDistributionMethodId.ApplePush: return "Apple Push Notification";
      case NotificationDistributionMethodId.Email: return "Email";
      case NotificationDistributionMethodId.GooglePush: return "Google Push Notification";
      case NotificationDistributionMethodId.Sms: return "SMS";
      case NotificationDistributionMethodId.WebPush: return "Web Push";
      case NotificationDistributionMethodId.Debug: return "Debugging";
    }
  }

  export function statusIdToDisplay(si: ActiveFaultedStatusId): string {
    switch (si) {
      case ActiveFaultedStatusId.Active: return "Active";
      case ActiveFaultedStatusId.Faulted: return "Errored";
      case ActiveFaultedStatusId.Inactive: return "Inactive";
    }
  }

}

import { ZenithProtocolCommon } from "@plxtra/motif-core";

export class EmailChannelSettings implements ZenithProtocolCommon.NotificationChannelSettings {
  public email: string;
  public name: string;
}

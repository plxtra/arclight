import { MultiEvent } from '@pbkware/js-utils';
import { SecurityDataItem } from "@plxtra/motif-core";

export interface SymbolListDataModel {
  dataItem: SecurityDataItem;
  subidEndChanges: MultiEvent.SubscriptionId;
  subidFieldValuesChanged: MultiEvent.SubscriptionId;
}

import { zIvemId, zstring } from "../../types/nullable-types";

export interface NewOrderPlacementTransferModel {
  side: "buy" | "sell";
  ivemId: zIvemId;
  accountZenithCode: zstring;
}

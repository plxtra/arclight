import { SourceTzOffsetDateTime, UnreachableCaseError } from '@pbkware/js-utils';
import { RevRecordValueRecentChangeTypeId } from 'revgrid';
import { ErrorIndicator } from "src/app/errors/error-indicator";
import { GeneralError } from "src/app/errors/general.error";
import { zSourceTzOffsetDateTime } from "./nullable-types";

export type RecentMovement = typeof RecentMovement.UNCHANGED /*| typeof RecentMovement.UPDATE*/ | typeof RecentMovement.INCREASE | typeof RecentMovement.DECREASE;

export namespace RecentMovement {
  export const UNCHANGED = 0;
  export const UPDATE = 1;
  export const INCREASE = 1;
  export const DECREASE = -1;

  export function asRecentMovement(valueRecentChangeTypeId: RevRecordValueRecentChangeTypeId | undefined): RecentMovement {
    switch (valueRecentChangeTypeId) {
      case undefined: return RecentMovement.UNCHANGED;
      case RevRecordValueRecentChangeTypeId.Decrease: return RecentMovement.DECREASE;
      case RevRecordValueRecentChangeTypeId.Increase: return RecentMovement.INCREASE;
      case RevRecordValueRecentChangeTypeId.Update: return RecentMovement.UPDATE;
      default:
        throw new UnreachableCaseError('STRMASM33009', valueRecentChangeTypeId);
    }
  }
}

export namespace SourceTzOffsetDateTimeExt {
  export function getAdjustedDate(value: zSourceTzOffsetDateTime, adjustment: SourceTzOffsetDateTime.TimezoneModeId): Date {
    if (value === undefined)
      throw new GeneralError(ErrorIndicator.AE775110984, "Undefined sourced DateTime");
    const utcDate = value.utcDate;
    switch (adjustment) {
      case SourceTzOffsetDateTime.TimezoneModeId.Local:
        return new Date(value.utcDate.getTime() - utcDate.getTimezoneOffset() * 60 * 1000);
      case SourceTzOffsetDateTime.TimezoneModeId.Source:
        return new Date(utcDate.getTime() + value.offset);
      case SourceTzOffsetDateTime.TimezoneModeId.Utc:
        return utcDate;
      default:
        throw new GeneralError(ErrorIndicator.AE775110984, "Unsupported adjustment type");
    }
  }
}

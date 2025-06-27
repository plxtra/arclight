import { ErrorIndicator } from "./error-indicator";

export class GeneralError extends Error {
  constructor(indicator: ErrorIndicator, message?: string) {
    const msg = `GEN-${indicator}: ${message}`;
    super(msg);
  }
}

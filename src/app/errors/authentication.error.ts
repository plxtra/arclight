import { ErrorIndicator } from "./error-indicator";

export class AuthenticationError extends Error {
  constructor(indicator: ErrorIndicator, message?: string) {
    const msg = `AUTH-${indicator}: ${message}`;
    super(msg);
  }
}

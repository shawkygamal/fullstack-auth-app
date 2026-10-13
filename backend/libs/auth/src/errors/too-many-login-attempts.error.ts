import { TooManyRequestsError } from "@auth-app/lib/base-api";

export class TooManyLoginAttemptsError extends TooManyRequestsError {
  constructor(retryAfterSeconds: number) {
    const minutes = Math.ceil(retryAfterSeconds / 60);

    super(`Too many failed sign-in attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`, retryAfterSeconds);
  }
}

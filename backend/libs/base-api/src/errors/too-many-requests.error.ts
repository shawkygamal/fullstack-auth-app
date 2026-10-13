import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * A 429 that tells the client when to retry. `ErrorResponseExceptionFilter` sends it as the `Retry-After` header.
 */
export class TooManyRequestsError extends HttpException {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

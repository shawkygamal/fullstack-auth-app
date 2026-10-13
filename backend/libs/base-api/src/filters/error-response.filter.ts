import { ArgumentsHost, Catch, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

import { TooManyRequestsError } from "../errors/too-many-requests.error";
import { AbstractExceptionFilter } from "./abstract-exception-filter";
import { ErrorResponse } from "./error-response";

/**
 * Catch-all exception filter. An `HttpException` answers with its own status; anything else answers a
 * bare 500, so internals never leak to the client.
 */
@Catch()
export class ErrorResponseExceptionFilter extends AbstractExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof TooManyRequestsError) {
      host.switchToHttp().getResponse<Response>().setHeader("Retry-After", exception.retryAfterSeconds);
    }

    super.catch(exception, host);
  }

  protected getErrorResponse(exception: unknown): ErrorResponse {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        name: exception.name,
        messages: this.extractMessages(exception),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      name: "InternalServerError",
      messages: [],
    };
  }

  private extractMessages(exception: HttpException): string[] {
    const response = exception.getResponse();
    const payload = typeof response === "object" && response !== null ? (response as { message?: unknown }).message : response;
    const messages = (Array.isArray(payload) ? payload : [payload]).filter(
      (message): message is string => typeof message === "string",
    );

    return messages.length > 0 ? messages : [exception.message];
  }
}

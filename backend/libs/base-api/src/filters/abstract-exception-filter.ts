import { ArgumentsHost, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

import { ExtendedRequest } from "../constants/constants";
import { ErrorResponse } from "./error-response";

/**
 * Answers every error with the same `{ statusCode, name, messages }` body and logs it:
 * client errors as warnings, server errors with their stack.
 */
export abstract class AbstractExceptionFilter<T = unknown> implements ExceptionFilter {
  protected readonly logger = new Logger(this.constructor.name);

  public catch(exception: T, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<ExtendedRequest>();

    const errorResponse = this.getErrorResponse(exception);

    if (errorResponse.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : exception);
    } else {
      this.logger.warn(`${request.method} ${request.url} ${errorResponse.statusCode} ${errorResponse.messages.join(", ")}`);
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  protected abstract getErrorResponse(exception: T): ErrorResponse;
}

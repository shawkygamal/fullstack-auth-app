import { Catch, HttpStatus } from "@nestjs/common";

import { ApiValidationError } from "../errors/api.error";
import { AbstractExceptionFilter } from "./abstract-exception-filter";
import { ErrorResponse } from "./error-response";

@Catch(ApiValidationError)
export class ValidationErrorFilter extends AbstractExceptionFilter<ApiValidationError> {
  protected getErrorResponse(exception: ApiValidationError): ErrorResponse {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      name: "ValidationError",
      messages: exception.errorMessages,
    };
  }
}

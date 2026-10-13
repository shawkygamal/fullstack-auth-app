import { ValidationError } from "class-validator";

/**
 * Thrown by the global ValidationPipe. Mapped to a 400 response by `ValidationErrorFilter`.
 */
export class ApiValidationError extends Error {
  public readonly errorMessages: string[];

  constructor(errors: ValidationError[]) {
    super("ValidationError");

    this.name = this.constructor.name;
    this.errorMessages = ApiValidationError.extractMessages(errors);
    this.message = this.errorMessages.join(", ");
  }

  private static extractMessages(errors: ValidationError[]): string[] {
    return errors.flatMap(error => [
      ...Object.values(error.constraints ?? {}),
      ...ApiValidationError.extractMessages(error.children ?? []),
    ]);
  }
}

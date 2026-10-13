import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";

/**
 * Swagger decorators for a route that needs the bearer token
 */
export function ApiAuth() {
  return applyDecorators(ApiBearerAuth(), ApiUnauthorizedResponse({ description: "Not authorized" }));
}

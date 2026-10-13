import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { ApiPropertyExposeOptions } from "../constants/api-property-expose-options";

/**
 * Applies swagger `@ApiProperty` & class-transformer `@Expose`, so a response field is both documented and
 * kept by `@Serialize`. A field without it is stripped from the response.
 */
export function ApiPropertyExpose(options?: ApiPropertyExposeOptions) {
  return applyDecorators(ApiProperty(options?.apiPropertyOptions), Expose(options?.exposeOptions));
}

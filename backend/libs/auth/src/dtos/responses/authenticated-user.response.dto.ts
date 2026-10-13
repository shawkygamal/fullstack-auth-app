import { Type } from "class-transformer";

import { ApiPropertyExpose } from "@auth-app/lib/base-api";
import { UserResponseDto } from "@auth-app/lib/user";

export class AuthenticatedUserResponseDto {
  @ApiPropertyExpose({ apiPropertyOptions: { type: String, description: "Short-lived JWT, sent as `Authorization: Bearer`" } })
  public readonly accessToken: string;

  @ApiPropertyExpose({ apiPropertyOptions: { type: UserResponseDto } })
  @Type(() => UserResponseDto)
  public readonly user: UserResponseDto;
}

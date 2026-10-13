import { ApiPropertyExpose } from "@auth-app/lib/base-api";

export class AccessTokenResponseDto {
  @ApiPropertyExpose({ apiPropertyOptions: { type: String, description: "Short-lived JWT, sent as `Authorization: Bearer`" } })
  public readonly accessToken: string;
}

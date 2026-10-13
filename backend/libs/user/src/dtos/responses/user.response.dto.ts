import { ApiPropertyExpose } from "@auth-app/lib/base-api";

export class UserResponseDto {
  @ApiPropertyExpose({ apiPropertyOptions: { type: String, example: "665f1c2e8b3e4a0012345678" } })
  public readonly id: string;

  @ApiPropertyExpose({ apiPropertyOptions: { type: String, example: "john.doe@example.com" } })
  public readonly email: string;

  @ApiPropertyExpose({ apiPropertyOptions: { type: String, example: "John Doe" } })
  public readonly name: string;
}

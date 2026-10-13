import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ApiAuth, CurrentUser, type JwtPayload, Serialize } from "@auth-app/lib/base-api";
import { type UserProfile, UserResponseDto, UserService } from "@auth-app/lib/user";

@ApiTags("User")
@ApiAuth()
@Controller("users")
export class AppUserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "Get the signed-in user's profile" })
  @ApiOkResponse({ type: UserResponseDto })
  @Serialize(UserResponseDto)
  getProfile(@CurrentUser() user: JwtPayload): Promise<UserProfile> {
    return this.userService.getUserProfile(user.sub);
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request, Response } from "express";

import {
  AccessTokenResponseDto,
  AuthService,
  type AuthenticatedSession,
  AuthenticatedUserResponseDto,
  InvalidRefreshTokenError,
  LoginDto,
  RegisterDto,
} from "@auth-app/lib/auth";
import { PublicRoute, Serialize } from "@auth-app/lib/base-api";

import { REFRESH_TOKEN_COOKIE, clearRefreshTokenCookie, readRefreshTokenCookie, setRefreshTokenCookie } from "./refresh-token-cookie";

const PER_MINUTE = 60_000;

type AuthenticatedUser = Omit<AuthenticatedSession, "refreshToken">;

const TOO_MANY_REQUESTS = "Too many requests; the `Retry-After` header says how many seconds to wait";

/**
 * Login is limited on two levels: per IP here (whatever the emails), and per account in `AuthService`
 * (whatever the IPs), which pauses an email after 5 failed attempts in 15 minutes.
 */
@ApiTags("Auth")
@Controller("auth")
@PublicRoute()
@UseGuards(ThrottlerGuard)
export class AppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { ttl: PER_MINUTE, limit: 5 } })
  @ApiOperation({ summary: "Sign up", description: "Answers with an access token and sets the refresh token cookie." })
  @ApiBadRequestResponse()
  @ApiConflictResponse({ description: "The email is already registered" })
  @ApiTooManyRequestsResponse({ description: TOO_MANY_REQUESTS })
  @ApiCreatedResponse({ type: AuthenticatedUserResponseDto })
  @Serialize(AuthenticatedUserResponseDto)
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<AuthenticatedUser> {
    const { refreshToken, ...session } = await this.authService.register(body);

    setRefreshTokenCookie(res, refreshToken);

    return session;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: PER_MINUTE, limit: 10 } })
  @ApiOperation({ summary: "Sign in", description: "Answers with an access token and sets the refresh token cookie." })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse({ description: "Invalid email or password; warns when 2 or fewer attempts are left" })
  @ApiTooManyRequestsResponse({ description: `${TOO_MANY_REQUESTS}. Also answered while sign-in for the email is paused` })
  @ApiOkResponse({ type: AuthenticatedUserResponseDto })
  @Serialize(AuthenticatedUserResponseDto)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response): Promise<AuthenticatedUser> {
    const { refreshToken, ...session } = await this.authService.login(body.email, body.password);

    setRefreshTokenCookie(res, refreshToken);

    return session;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: PER_MINUTE, limit: 30 } })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOperation({ summary: "Get a new access token", description: "Rotates the refresh token cookie." })
  @ApiUnauthorizedResponse({ description: "No session, or it expired or was revoked" })
  @ApiTooManyRequestsResponse({ description: TOO_MANY_REQUESTS })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @Serialize(AccessTokenResponseDto)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Pick<AuthenticatedSession, "accessToken">> {
    const refreshToken = readRefreshTokenCookie(req);

    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    try {
      const { accessToken, refreshToken: rotatedToken } = await this.authService.refresh(refreshToken);

      if (rotatedToken) {
        setRefreshTokenCookie(res, rotatedToken);
      }

      return { accessToken };
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        clearRefreshTokenCookie(res);
      }
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOperation({ summary: "Sign out", description: "Revokes the session and clears the cookie. Works with an expired access token." })
  @ApiNoContentResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = readRefreshTokenCookie(req);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    clearRefreshTokenCookie(res);
  }
}

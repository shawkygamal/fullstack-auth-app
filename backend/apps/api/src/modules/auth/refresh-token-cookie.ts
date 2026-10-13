import { CookieOptions, Request, Response } from "express";

import { GLOBAL_API_PREFIX, appConfig } from "../../config/app.config";

export const REFRESH_TOKEN_COOKIE = "refresh_token";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * httpOnly: unreadable by scripts, so an XSS cannot steal it. SameSite=Strict: never sent from another site, so
 * the refresh and logout routes are not CSRF-able. Scoped to the auth routes, the only ones that need it.
 */
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: appConfig.COOKIE_SECURE,
  sameSite: "strict",
  path: `/${GLOBAL_API_PREFIX}/auth`,
});

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions(), maxAge: appConfig.REFRESH_TOKEN_TTL_DAYS * DAY_MS });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions());
}

export function readRefreshTokenCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];

  return typeof value === "string" && value ? value : undefined;
}

import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, MinLength } from "class-validator";

import { Environment } from "./environment.enum";

/**
 * Environment variables the libs depend on. HTTP-only settings (port, cookies, CORS, proxies) belong to the app's
 * own schema, which extends this one.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  public NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsNotEmpty()
  public MONGODB_URI: string;

  @IsString()
  @MinLength(32)
  public JWT_SECRET: string;

  /** Lifetime of the access token. Short, since it cannot be revoked; the refresh token renews it. */
  @IsString()
  @IsNotEmpty()
  public JWT_EXPIRES_IN: string = "15m";

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  public REFRESH_TOKEN_TTL_DAYS: number = 7;
}

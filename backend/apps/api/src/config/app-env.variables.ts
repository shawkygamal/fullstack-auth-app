import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString, Min } from "class-validator";

import { EnvironmentVariables } from "@auth-app/lib/config";

/**
 * Environment variables needed for running the API application: the shared ones plus its HTTP settings
 */
export class AppEnvVariables extends EnvironmentVariables {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  public APP_PORT: number = 3000;

  /**
   * How many reverse proxies sit in front of the API. Behind a proxy every request comes from the proxy's IP,
   * so without this the per-IP rate limit would be shared by all users.
   */
  @IsInt()
  @Min(0)
  @Type(() => Number)
  public TRUST_PROXY_HOPS: number = 0;

  /** Send the refresh cookie over HTTPS only. Turn off only for local plain-HTTP setups. */
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  public COOKIE_SECURE: boolean = true;

  /** Only needed when the client is served from another origin than the API. */
  @IsString()
  @IsNotEmpty()
  public CORS_ORIGINS: string = "http://localhost:5173";
}

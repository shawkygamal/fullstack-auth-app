import { existsSync } from "node:fs";

let loaded = false;

/**
 * Loads `.env` (when present) into `process.env` once. Real environment variables always win.
 */
export function getEnv(): Record<string, string | undefined> {
  if (!loaded && existsSync(".env")) {
    process.loadEnvFile(".env");
  }
  loaded = true;

  return process.env;
}

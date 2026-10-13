import { getEnv, validateConfig } from "@auth-app/lib/config";

import { AppEnvVariables } from "./app-env.variables";

export const appConfig = validateConfig(getEnv(), AppEnvVariables);

export const GLOBAL_API_PREFIX = "api";

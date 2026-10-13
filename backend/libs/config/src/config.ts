import { EnvironmentVariables } from "./env.variables";
import { validateConfig } from "./env.validation";
import { getEnv } from "./get-env";

/** The validated environment shared by the libs. Throws on first import when a variable is missing or invalid. */
export const sharedConfig = validateConfig(getEnv(), EnvironmentVariables);

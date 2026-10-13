import { ClassConstructor, plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

/**
 * Validates the raw environment against a class-validator DTO and fails fast on boot when it is invalid.
 */
export function validateConfig<T extends object>(config: Record<string, unknown>, envDto: ClassConstructor<T>): T {
  const validatedConfig = plainToInstance(envDto, config, { exposeDefaultValues: true });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors.flatMap(error => Object.values(error.constraints ?? {}));

    throw new Error(`Config initialization error:\n${messages.join(",\n")}`);
  }

  return validatedConfig;
}

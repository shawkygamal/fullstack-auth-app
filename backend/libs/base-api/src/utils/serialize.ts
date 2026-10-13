import { plainToInstance } from "class-transformer";

import { ClassConstructor } from "../constants/constants";

/**
 * Serialize data into the given response DTO, keeping only its `@Expose`d fields
 */
export function serialize<T, K>(dto: ClassConstructor<T>, data: K): T {
  return plainToInstance(dto, data, { excludeExtraneousValues: true });
}

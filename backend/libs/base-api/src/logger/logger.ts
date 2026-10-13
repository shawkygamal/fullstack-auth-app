import { ConsoleLogger, LoggerService } from "@nestjs/common";

/**
 * Human-readable colored logs locally, one JSON object per line in production for log aggregators.
 */
export function createLogger(appName: string, json: boolean): LoggerService {
  return new ConsoleLogger(appName, { json, colors: !json, timestamp: !json });
}

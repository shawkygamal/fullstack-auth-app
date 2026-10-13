import { ConsoleLogger, LogLevel, LoggerService } from "@nestjs/common";

import { currentRequestId } from "../request-context/request-context";

/** Nest's log levels, from the most to the least verbose. `LOG_LEVEL` names the lowest one to print. */
export const LOG_LEVELS = ["verbose", "debug", "log", "warn", "error", "fatal"] as const satisfies readonly LogLevel[];

/** The levels printed when `minimum` is the configured `LOG_LEVEL`: that one and every more severe one. */
export function logLevelsFrom(minimum: LogLevel): LogLevel[] {
  return LOG_LEVELS.slice(LOG_LEVELS.indexOf(minimum));
}

/**
 * Nest's console logger, plus the id of the request each line belongs to: a `requestId` field in JSON,
 * `(id)` after the context in text. Every log call made while handling a request gets it, with no changes at
 * the call sites.
 */
export class AppLogger extends ConsoleLogger {
  protected getJsonLogObject(...args: Parameters<ConsoleLogger["getJsonLogObject"]>) {
    const requestId = currentRequestId();
    const logObject = super.getJsonLogObject(...args);

    return requestId ? { ...logObject, requestId } : logObject;
  }

  protected formatContext(context: string): string {
    const requestId = currentRequestId();
    const formatted = super.formatContext(context);

    return requestId ? `${formatted}(${requestId}) ` : formatted;
  }
}

/**
 * Human-readable colored logs locally, one JSON object per line in production for log aggregators.
 */
export function createLogger(appName: string, options: { json: boolean; level: LogLevel }): LoggerService {
  return new AppLogger(appName, {
    json: options.json,
    colors: !options.json,
    timestamp: !options.json,
    logLevels: logLevelsFrom(options.level),
  });
}

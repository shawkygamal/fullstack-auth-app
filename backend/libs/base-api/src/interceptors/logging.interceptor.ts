import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export interface LoggingInterceptorOptions {
  /** Paths whose successful requests are not logged. Errors are still logged by the exception filters. */
  skipPaths?: string[];
}

/**
 * Logs method, url, status and duration of every successful request. Bodies are never logged, since
 * auth requests carry passwords. Failed requests are logged by the exception filters.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly options: LoggingInterceptorOptions = {}) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const { method, url, path } = http.getRequest<Request>();

    if (this.options.skipPaths?.includes(path)) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = http.getResponse<Response>();

        this.logger.log(`${method} ${url} ${statusCode} +${Date.now() - startedAt}ms`);
      }),
    );
  }
}

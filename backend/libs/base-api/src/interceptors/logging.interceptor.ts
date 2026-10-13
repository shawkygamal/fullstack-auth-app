import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Logs method, url, status and duration of every successful request. Bodies are never logged, since
 * auth requests carry passwords. Failed requests are logged by the exception filters.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const { method, url } = http.getRequest<Request>();

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = http.getResponse<Response>();

        this.logger.log(`${method} ${url} ${statusCode} +${Date.now() - startedAt}ms`);
      }),
    );
  }
}

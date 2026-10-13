import { LoggerService, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import {
  ApiValidationError,
  ErrorResponseExceptionFilter,
  JwtAuthGuard,
  LoggingInterceptor,
  REQUEST_ID_HEADER,
  ValidationErrorFilter,
  requestContextMiddleware,
} from "@auth-app/lib/base-api";
import { Environment } from "@auth-app/lib/config";

import { GLOBAL_API_PREFIX, appConfig } from "./config/app.config";

/**
 * Everything `main.ts` applies to the app, shared with the e2e tests so they exercise the real setup.
 */
export function configureApp(app: NestExpressApplication, logger: LoggerService): void {
  app.useLogger(logger);
  app.set("trust proxy", appConfig.TRUST_PROXY_HOPS);

  // First, so the request id covers everything that runs for the request, its log lines included.
  app.use(requestContextMiddleware);

  // Only used when the client is on another origin; behind the bundled proxies (Vite, nginx) it is the same origin.
  // Credentials let the refresh cookie travel.
  app.enableCors({
    origin: appConfig.CORS_ORIGINS.split(",").map(origin => origin.trim()),
    credentials: true,
    exposedHeaders: ["Retry-After", REQUEST_ID_HEADER],
  });

  app.use(helmet());
  app.use(cookieParser());

  app.setGlobalPrefix(GLOBAL_API_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: errors => new ApiValidationError(errors),
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  // Nest tries filters from last to first, so the catch-all goes first.
  app.useGlobalFilters(new ErrorResponseExceptionFilter(), new ValidationErrorFilter());
  // Secure by default: every route needs a valid token unless marked with @PublicRoute().
  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector), app.get(JwtService)));

  app.enableShutdownHooks();
}

/**
 * Serves the OpenAPI docs at `/api/docs` when `SWAGGER_ENABLED` is true, or by default everywhere except production.
 *
 * @returns whether the docs were mounted
 */
export function setupSwagger(app: NestExpressApplication, projectName: string): boolean {
  const enabled = appConfig.SWAGGER_ENABLED ?? appConfig.NODE_ENV !== Environment.Production;

  if (!enabled) {
    return false;
  }

  const config = new DocumentBuilder()
    .setTitle(`${projectName} API Docs`)
    .setDescription(`Interactions with the ${projectName} API`)
    .setVersion(process.env.npm_package_version ?? "1.0")
    .addBearerAuth()
    .build();

  SwaggerModule.setup(`${GLOBAL_API_PREFIX}/docs`, app, SwaggerModule.createDocument(app, config));

  return true;
}

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { createLogger } from "@auth-app/lib/base-api";
import { Environment } from "@auth-app/lib/config";

import { AppModule } from "./app.module";
import { configureApp, setupSwagger } from "./app.setup";
import { appConfig } from "./config/app.config";

const APP_NAME = "AUTH-APP";

async function bootstrap() {
  const logger = createLogger(APP_NAME, appConfig.NODE_ENV === Environment.Production);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });

  configureApp(app, logger);

  const isSwaggerEnabled = setupSwagger(app, APP_NAME);

  await app.listen(appConfig.APP_PORT);

  logger.log(`Listening on port: ${appConfig.APP_PORT}`);

  if (isSwaggerEnabled) {
    logger.log(`Explore api on http://localhost:${appConfig.APP_PORT}/api/docs`);
  }
}

bootstrap();

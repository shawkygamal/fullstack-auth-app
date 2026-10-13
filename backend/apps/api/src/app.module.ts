import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";

import { appConfig } from "./config/app.config";
import { AppAuthModule } from "./modules/auth/app-auth.module";
import { AppHealthModule } from "./modules/health/app-health.module";
import { AppUserModule } from "./modules/user/app-user.module";

@Module({
  imports: [
    MongooseModule.forRoot(appConfig.MONGODB_URI),
    // Per-IP request limits, applied on the routes that opt in with ThrottlerGuard.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      errorMessage: "Too many requests. Please wait a moment and try again.",
    }),
    AppAuthModule,
    AppUserModule,
    AppHealthModule,
  ],
})
export class AppModule {}

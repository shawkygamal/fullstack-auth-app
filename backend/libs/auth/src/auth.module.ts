import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";

import { UserModule } from "@auth-app/lib/user";

import { AuthService } from "./auth.service";
import { jwtModuleOptions } from "./config/jwt-module-options";
import { LoginAttempt, LoginAttemptSchema } from "./entities/login-attempt.entity";
import { Session, SessionSchema } from "./entities/session.entity";
import { LoginAttemptService } from "./login-attempt.service";
import { LoginAttemptRepository } from "./repositories/login-attempt.repository";
import { SessionRepository } from "./repositories/session.repository";
import { SessionService } from "./session.service";

/**
 * Registers the JWT module globally, so the global `JwtAuthGuard` can verify tokens on every route.
 */
@Module({
  imports: [
    JwtModule.registerAsync({ global: true, useFactory: jwtModuleOptions }),
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
    ]),
    UserModule,
  ],
  providers: [AuthService, SessionService, LoginAttemptService, SessionRepository, LoginAttemptRepository],
  exports: [AuthService],
})
export class AuthModule {}

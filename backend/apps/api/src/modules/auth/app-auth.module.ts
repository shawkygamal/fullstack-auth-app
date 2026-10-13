import { Module } from "@nestjs/common";

import { AuthModule } from "@auth-app/lib/auth";

import { AppAuthController } from "./app-auth.controller";

@Module({
  imports: [AuthModule],
  controllers: [AppAuthController],
})
export class AppAuthModule {}

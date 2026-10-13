import { Module } from "@nestjs/common";

import { UserModule } from "@auth-app/lib/user";

import { AppUserController } from "./app-user.controller";

@Module({
  imports: [UserModule],
  controllers: [AppUserController],
})
export class AppUserModule {}

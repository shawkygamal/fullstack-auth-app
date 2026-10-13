import { Module } from "@nestjs/common";

import { AppHealthController } from "./app-health.controller";

@Module({
  controllers: [AppHealthController],
})
export class AppHealthModule {}

import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { Connection, ConnectionStates } from "mongoose";

import { PublicRoute } from "@auth-app/lib/base-api";

export const HEALTH_ROUTE = "health";

@ApiTags("Health")
@Controller(HEALTH_ROUTE)
@PublicRoute()
export class AppHealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: "Liveness and database readiness, for container and load-balancer health checks" })
  @ApiOkResponse({ schema: { example: { status: "ok" } } })
  @ApiServiceUnavailableResponse({ description: "The database is unreachable" })
  check(): { status: string } {
    if (this.connection.readyState !== ConnectionStates.connected) {
      throw new ServiceUnavailableException("Database unavailable");
    }

    return { status: "ok" };
  }
}

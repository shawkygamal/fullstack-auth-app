import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { ExtendedRequest } from "../constants/constants";
import { PUBLIC_ROUTE_KEY } from "../decorators/public-route.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const jwtService = new JwtService({ secret: "test-secret" });

  function contextFor(request: Partial<ExtendedRequest>, isPublic = false): ExecutionContext {
    const handler = () => undefined;
    class TestController {}
    if (isPublic) {
      Reflect.defineMetadata(PUBLIC_ROUTE_KEY, true, handler);
    }

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  const guard = new JwtAuthGuard(new Reflector(), jwtService);

  it("lets a public route through without a token", async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }, true))).resolves.toBe(true);
  });

  it("rejects a request without a bearer token", async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a token signed with another secret", async () => {
    const token = new JwtService({ secret: "other-secret" }).sign({ sub: "user-id", email: "john@example.com" });

    await expect(guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("attaches the token payload to the request for a valid token", async () => {
    const token = jwtService.sign({ sub: "user-id", email: "john@example.com" });
    const request: Partial<ExtendedRequest> = { headers: { authorization: `Bearer ${token}` } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: "user-id", email: "john@example.com" });
  });
});

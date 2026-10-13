import { Logger } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { Connection } from "mongoose";

import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";

/**
 * The full HTTP flow against a real MongoDB (`MONGODB_URI_TEST`, default a local `auth-app-test` database).
 */
describe("Auth (e2e)", () => {
  const password = "P@ssw0rd!";
  let app: NestExpressApplication;
  let baseUrl: string;

  // Each test acts from its own client IP (trusted via X-Forwarded-For), so per-IP limits do not leak between tests.
  const post = (path: string, body?: object, { cookie, ip = "10.0.0.1" }: { cookie?: string; ip?: string } = {}) =>
    fetch(`${baseUrl}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": ip, ...(cookie ? { Cookie: cookie } : {}) },
      body: body && JSON.stringify(body),
    });

  const refreshCookieOf = (response: Response): string | undefined =>
    response.headers
      .getSetCookie()
      .find(cookie => cookie.startsWith("refresh_token=") && !cookie.startsWith("refresh_token=;"))
      ?.split(";")[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, new Logger());
    await app.listen(0);
    baseUrl = await app.getUrl();

    const connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    await connection.syncIndexes();
  });

  afterAll(async () => {
    await app.get<Connection>(getConnectionToken()).dropDatabase();
    await app.close();
  });

  it("reports healthy", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);
  });

  describe("session lifecycle", () => {
    const email = "session@example.com";
    let accessToken: string;
    let cookie: string;

    it("signs up with an access token, the user, and an httpOnly refresh cookie", async () => {
      const response = await post("/auth/register", { email, name: "Session User", password });
      const body = (await response.json()) as { accessToken: string; user: Record<string, string> };
      const setCookie = response.headers.getSetCookie()[0];

      expect(response.status).toBe(201);
      expect(Object.keys(body).sort()).toEqual(["accessToken", "user"]);
      expect(Object.keys(body.user).sort()).toEqual(["email", "id", "name"]);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Strict");
      expect(setCookie).toContain("Path=/api/auth");

      accessToken = body.accessToken;
      cookie = refreshCookieOf(response)!;
    });

    it("rejects a second sign-up with the same email", async () => {
      const response = await post("/auth/register", { email, name: "Someone Else", password });

      expect(response.status).toBe(409);
    });

    it("serves the protected profile only with the access token", async () => {
      const withToken = await fetch(`${baseUrl}/api/users/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const withoutToken = await fetch(`${baseUrl}/api/users/me`);

      expect(withToken.status).toBe(200);
      expect(await withToken.json()).toMatchObject({ email, name: "Session User" });
      expect(withoutToken.status).toBe(401);
    });

    it("rotates the refresh token, still accepting the old one within the grace period", async () => {
      const first = await post("/auth/refresh", undefined, { cookie });
      const rotatedCookie = refreshCookieOf(first);
      const concurrent = await post("/auth/refresh", undefined, { cookie });

      expect(first.status).toBe(200);
      expect(rotatedCookie).toBeDefined();
      expect(rotatedCookie).not.toBe(cookie);
      expect(concurrent.status).toBe(200);
      expect(refreshCookieOf(concurrent)).toBeUndefined();

      cookie = rotatedCookie!;
    });

    it("signs out, after which the refresh token no longer works", async () => {
      const logout = await post("/auth/logout", undefined, { cookie });
      const refresh = await post("/auth/refresh", undefined, { cookie });

      expect(logout.status).toBe(204);
      expect(refresh.status).toBe(401);
    });
  });

  describe("login rate limiting", () => {
    const email = "locked@example.com";

    beforeAll(async () => {
      await post("/auth/register", { email, name: "Locked User", password }, { ip: "10.0.1.0" });
    });

    it("warns as attempts run out, then pauses the account with Retry-After", async () => {
      const responses: { status: number; messages: string[]; retryAfter: string | null }[] = [];

      for (let attempt = 0; attempt < 5; attempt++) {
        const response = await post("/auth/login", { email, password: "Wrong-pass1!" }, { ip: "10.0.1.1" });
        const { messages } = (await response.json()) as { messages: string[] };
        responses.push({ status: response.status, messages, retryAfter: response.headers.get("retry-after") });
      }

      expect(responses.map(response => response.status)).toEqual([401, 401, 401, 401, 429]);
      expect(responses[1].messages).toEqual(["Invalid email or password"]);
      expect(responses[3].messages[1]).toBe("1 attempt left before sign-in is paused for 15 minutes");
      expect(responses[4].messages[0]).toMatch(/Too many failed sign-in attempts/);
      expect(Number(responses[4].retryAfter)).toBeGreaterThan(14 * 60);
    });

    it("keeps the account paused for the right password, from any IP", async () => {
      const response = await post("/auth/login", { email, password }, { ip: "10.0.1.2" });

      expect(response.status).toBe(429);
    });

    it("counts unknown emails the same way, so the pause does not reveal which accounts exist", async () => {
      const statuses: number[] = [];

      for (let attempt = 0; attempt < 5; attempt++) {
        statuses.push((await post("/auth/login", { email: "nobody@example.com", password }, { ip: "10.0.1.3" })).status);
      }

      expect(statuses).toEqual([401, 401, 401, 401, 429]);
    });

    it("limits each IP to 10 sign-in requests a minute, whatever the emails", async () => {
      const statuses: number[] = [];
      let last: Response | undefined;

      for (let attempt = 0; attempt < 11; attempt++) {
        last = await post("/auth/login", { email: `user${attempt}@example.com`, password }, { ip: "10.0.1.4" });
        statuses.push(last.status);
      }

      expect(statuses.slice(0, 10).every(status => status === 401)).toBe(true);
      expect(statuses[10]).toBe(429);
      expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
    });

    it("clears the failure count after a successful sign-in", async () => {
      const ip = "10.0.1.5";
      await post("/auth/register", { email: "fine@example.com", name: "Fine User", password }, { ip });
      await post("/auth/login", { email: "fine@example.com", password: "Wrong-pass1!" }, { ip });

      const success = await post("/auth/login", { email: "fine@example.com", password }, { ip });
      const failureAfter = await post("/auth/login", { email: "fine@example.com", password: "Wrong-pass1!" }, { ip });

      expect(success.status).toBe(200);
      expect(((await failureAfter.json()) as { messages: string[] }).messages).toEqual(["Invalid email or password"]);
    });
  });
});

import { Logger } from "@nestjs/common";
import { createHash } from "node:crypto";

import { REFRESH_ROTATION_GRACE_MS } from "../constants/auth.constants";
import { InvalidRefreshTokenError } from "../errors/invalid-refresh-token.error";
import { SessionRepository, StoredSession } from "../repositories/session.repository";
import { SessionService } from "../session.service";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

describe("SessionService", () => {
  let service: SessionService;
  let repository: jest.Mocked<Pick<SessionRepository, "create" | "findByAnyTokenHash" | "rotate" | "deleteById" | "deleteByAnyTokenHash">>;

  const session = (overrides: Partial<StoredSession> = {}): StoredSession => ({
    id: "session-id",
    userId: "user-id",
    tokenHash: hash("current"),
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByAnyTokenHash: jest.fn(),
      rotate: jest.fn().mockResolvedValue(true),
      deleteById: jest.fn(),
      deleteByAnyTokenHash: jest.fn(),
    };
    service = new SessionService(repository as unknown as SessionRepository);
  });

  it("stores only the hash of a new refresh token", async () => {
    const token = await service.create("user-id");

    expect(repository.create).toHaveBeenCalledWith("user-id", hash(token), expect.any(Date));
    expect(repository.create.mock.calls[0][1]).not.toBe(token);
  });

  it("rotates the current token", async () => {
    repository.findByAnyTokenHash.mockResolvedValue(session());

    const result = await service.rotate("current");

    expect(result.userId).toBe("user-id");
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(repository.rotate).toHaveBeenCalledWith("session-id", hash("current"), hash(result.refreshToken!), expect.any(Date), expect.any(Date));
  });

  it("does not hand out a token when a concurrent request rotated first", async () => {
    repository.findByAnyTokenHash.mockResolvedValue(session());
    repository.rotate.mockResolvedValue(false);

    await expect(service.rotate("current")).resolves.toEqual({ userId: "user-id", refreshToken: undefined });
  });

  it("accepts the previous token within the grace period, without rotating again", async () => {
    repository.findByAnyTokenHash.mockResolvedValue(session({ previousTokenHash: hash("previous"), rotatedAt: new Date() }));

    await expect(service.rotate("previous")).resolves.toEqual({ userId: "user-id" });
    expect(repository.rotate).not.toHaveBeenCalled();
  });

  it("revokes the whole session when a rotated-out token is reused after the grace period", async () => {
    const rotatedAt = new Date(Date.now() - REFRESH_ROTATION_GRACE_MS - 1000);
    repository.findByAnyTokenHash.mockResolvedValue(session({ previousTokenHash: hash("previous"), rotatedAt }));

    await expect(service.rotate("previous")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    expect(repository.deleteById).toHaveBeenCalledWith("session-id");
  });

  it("logs the reuse as a security warning naming the session and user", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn");
    const rotatedAt = new Date(Date.now() - REFRESH_ROTATION_GRACE_MS - 1000);
    repository.findByAnyTokenHash.mockResolvedValue(session({ previousTokenHash: hash("previous"), rotatedAt }));

    await service.rotate("previous").catch(() => undefined);

    expect(warn).toHaveBeenCalledWith("Refresh token reuse detected, session session-id of user user-id revoked");
    warn.mockRestore();
  });

  it("rejects an unknown token", async () => {
    repository.findByAnyTokenHash.mockResolvedValue(null);

    await expect(service.rotate("unknown")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});

import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

import { sharedConfig } from "@auth-app/lib/config";

import { REFRESH_ROTATION_GRACE_MS, REFRESH_TOKEN_BYTES } from "./constants/auth.constants";
import { InvalidRefreshTokenError } from "./errors/invalid-refresh-token.error";
import { SessionRepository } from "./repositories/session.repository";

export interface RefreshedSession {
  userId: string;
  /** The rotated token, or undefined when another request already rotated it within the grace period. */
  refreshToken?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Refresh tokens: opaque random strings, rotated on every use and stored only as hashes. A rotated-out token
 * presented after the grace period means it was copied, so the whole session is revoked.
 */
@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async create(userId: string): Promise<string> {
    const refreshToken = SessionService.generateToken();

    await this.sessionRepository.create(userId, SessionService.hash(refreshToken), SessionService.expiresAt());

    return refreshToken;
  }

  /** @throws InvalidRefreshTokenError when the token is unknown, expired or reused */
  async rotate(refreshToken: string): Promise<RefreshedSession> {
    const tokenHash = SessionService.hash(refreshToken);
    const now = new Date();
    const session = await this.sessionRepository.findByAnyTokenHash(tokenHash, now);

    if (!session) {
      throw new InvalidRefreshTokenError();
    }

    if (session.tokenHash === tokenHash) {
      const newToken = SessionService.generateToken();
      const rotated = await this.sessionRepository.rotate(session.id, tokenHash, SessionService.hash(newToken), now, SessionService.expiresAt());

      return { userId: session.userId, refreshToken: rotated ? newToken : undefined };
    }

    if (session.rotatedAt && now.getTime() - new Date(session.rotatedAt).getTime() <= REFRESH_ROTATION_GRACE_MS) {
      return { userId: session.userId };
    }

    await this.sessionRepository.deleteById(session.id);
    throw new InvalidRefreshTokenError();
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.sessionRepository.deleteByAnyTokenHash(SessionService.hash(refreshToken));
  }

  private static generateToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
  }

  private static hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private static expiresAt(): Date {
    return new Date(Date.now() + sharedConfig.REFRESH_TOKEN_TTL_DAYS * DAY_MS);
  }
}

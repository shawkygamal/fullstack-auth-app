import { MAX_FAILED_LOGIN_ATTEMPTS } from "../constants/auth.constants";
import { TooManyLoginAttemptsError } from "../errors/too-many-login-attempts.error";
import { LoginAttemptService } from "../login-attempt.service";
import { LoginAttemptRepository } from "../repositories/login-attempt.repository";

describe("LoginAttemptService", () => {
  const inTenMinutes = () => new Date(Date.now() + 10 * 60 * 1000);

  let service: LoginAttemptService;
  let repository: jest.Mocked<Pick<LoginAttemptRepository, "findActive" | "incrementFailures" | "deleteByEmail">>;

  beforeEach(() => {
    repository = { findActive: jest.fn(), incrementFailures: jest.fn(), deleteByEmail: jest.fn() };
    service = new LoginAttemptService(repository as unknown as LoginAttemptRepository);
  });

  describe("assertNotPaused", () => {
    it("passes below the limit", async () => {
      repository.findActive.mockResolvedValue({ failures: MAX_FAILED_LOGIN_ATTEMPTS - 1, expiresAt: inTenMinutes() });

      await expect(service.assertNotPaused("john@example.com")).resolves.toBeUndefined();
    });

    it("throws with the seconds left in the pause once the limit is reached", async () => {
      repository.findActive.mockResolvedValue({ failures: MAX_FAILED_LOGIN_ATTEMPTS, expiresAt: inTenMinutes() });

      const error = await service.assertNotPaused("john@example.com").catch(e => e);

      expect(error).toBeInstanceOf(TooManyLoginAttemptsError);
      expect(error.retryAfterSeconds).toBeGreaterThan(595);
      expect(error.retryAfterSeconds).toBeLessThanOrEqual(600);
    });
  });

  describe("recordFailure", () => {
    it("returns the attempts left", async () => {
      repository.incrementFailures.mockResolvedValue({ failures: 2, expiresAt: inTenMinutes() });

      await expect(service.recordFailure("john@example.com")).resolves.toBe(MAX_FAILED_LOGIN_ATTEMPTS - 2);
    });

    it("answers the attempt that reaches the limit with the pause", async () => {
      repository.incrementFailures.mockResolvedValue({ failures: MAX_FAILED_LOGIN_ATTEMPTS, expiresAt: inTenMinutes() });

      await expect(service.recordFailure("john@example.com")).rejects.toBeInstanceOf(TooManyLoginAttemptsError);
    });
  });
});

import { Injectable } from "@nestjs/common";

import { FAILED_LOGIN_WINDOW_MS, MAX_FAILED_LOGIN_ATTEMPTS } from "./constants/auth.constants";
import { TooManyLoginAttemptsError } from "./errors/too-many-login-attempts.error";
import { LoginAttemptRepository } from "./repositories/login-attempt.repository";

/**
 * Per-account brute-force protection: after `MAX_FAILED_LOGIN_ATTEMPTS` failures within the window, sign-in for that
 * email is paused, whatever IP the attempts come from. Complements the per-IP request limit on the route.
 */
@Injectable()
export class LoginAttemptService {
  constructor(private readonly loginAttemptRepository: LoginAttemptRepository) {}

  /** @throws TooManyLoginAttemptsError while sign-in for this email is paused */
  async assertNotPaused(email: string): Promise<void> {
    const now = new Date();
    const state = await this.loginAttemptRepository.findActive(email, now);

    if (state && state.failures >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new TooManyLoginAttemptsError(LoginAttemptService.secondsUntil(state.expiresAt, now));
    }
  }

  /**
   * Records a failure. The attempt that reaches the limit is itself answered with the pause.
   *
   * @returns how many attempts are left before the pause
   * @throws TooManyLoginAttemptsError when this failure reached the limit
   */
  async recordFailure(email: string): Promise<number> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + FAILED_LOGIN_WINDOW_MS);

    const { failures, expiresAt } = await this.loginAttemptRepository.incrementFailures(
      email,
      now,
      windowEnd,
      MAX_FAILED_LOGIN_ATTEMPTS,
      windowEnd,
    );

    if (failures >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new TooManyLoginAttemptsError(LoginAttemptService.secondsUntil(expiresAt, now));
    }

    return MAX_FAILED_LOGIN_ATTEMPTS - failures;
  }

  async reset(email: string): Promise<void> {
    await this.loginAttemptRepository.deleteByEmail(email);
  }

  private static secondsUntil(date: Date, now: Date): number {
    return Math.max(1, Math.ceil((new Date(date).getTime() - now.getTime()) / 1000));
  }
}

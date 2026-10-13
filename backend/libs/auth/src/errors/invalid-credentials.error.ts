import { UnauthorizedException } from "@nestjs/common";

import { FAILED_LOGIN_WINDOW_MS, WARN_WHEN_ATTEMPTS_LEFT } from "../constants/auth.constants";

export class InvalidCredentialsError extends UnauthorizedException {
  constructor(attemptsLeft: number) {
    const messages = ["Invalid email or password"];

    if (attemptsLeft <= WARN_WHEN_ATTEMPTS_LEFT) {
      const attempts = `${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"}`;

      messages.push(`${attempts} left before sign-in is paused for ${FAILED_LOGIN_WINDOW_MS / 60_000} minutes`);
    }

    super(messages);
  }
}

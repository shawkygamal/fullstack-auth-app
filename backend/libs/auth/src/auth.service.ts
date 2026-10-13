import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { JwtPayload } from "@auth-app/lib/base-api";
import { CreateUser, UserProfile, UserService } from "@auth-app/lib/user";

import { InvalidCredentialsError } from "./errors/invalid-credentials.error";
import { InvalidRefreshTokenError } from "./errors/invalid-refresh-token.error";
import { AuthenticatedSession, RefreshedAccess } from "./interfaces/auth-result.interface";
import { LoginAttemptService } from "./login-attempt.service";
import { SessionService } from "./session.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: CreateUser): Promise<AuthenticatedSession> {
    const user = await this.userService.createUser(input);

    this.logger.log(`Account created for user ${user.id}`);

    return this.startSession(user);
  }

  /**
   * @throws TooManyLoginAttemptsError while sign-in for this email is paused, or when this failure pauses it
   * @throws InvalidCredentialsError on a wrong email or password
   */
  async login(email: string, password: string): Promise<AuthenticatedSession> {
    await this.loginAttemptService.assertNotPaused(email);

    const user = await this.userService.findByCredentials(email, password);

    if (!user) {
      const attemptsLeft = await this.loginAttemptService.recordFailure(email);

      throw new InvalidCredentialsError(attemptsLeft);
    }

    await this.loginAttemptService.reset(email);

    this.logger.log(`Signed in user ${user.id}`);

    return this.startSession(user);
  }

  async refresh(refreshToken: string): Promise<RefreshedAccess> {
    const { userId, refreshToken: rotatedToken } = await this.sessionService.rotate(refreshToken);
    const user = await this.findSessionUser(userId, refreshToken);

    return { accessToken: await this.signAccessToken(user), refreshToken: rotatedToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.revoke(refreshToken);

    this.logger.log("Signed out, session revoked");
  }

  private async startSession(user: UserProfile): Promise<AuthenticatedSession> {
    const [accessToken, refreshToken] = await Promise.all([this.signAccessToken(user), this.sessionService.create(user.id)]);

    return { accessToken, refreshToken, user };
  }

  private signAccessToken(user: UserProfile): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return this.jwtService.signAsync(payload);
  }

  /** A session can outlive its user (e.g. a deleted account); such a session is ended rather than renewed. */
  private async findSessionUser(userId: string, refreshToken: string): Promise<UserProfile> {
    try {
      return await this.userService.getUserProfile(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Session ended: user ${userId} no longer exists`);
        await this.sessionService.revoke(refreshToken);
        throw new InvalidRefreshTokenError();
      }
      throw error;
    }
  }
}

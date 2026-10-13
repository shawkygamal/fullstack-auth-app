import { NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserProfile, UserService } from "@auth-app/lib/user";

import { AuthService } from "../auth.service";
import { InvalidCredentialsError } from "../errors/invalid-credentials.error";
import { InvalidRefreshTokenError } from "../errors/invalid-refresh-token.error";
import { TooManyLoginAttemptsError } from "../errors/too-many-login-attempts.error";
import { LoginAttemptService } from "../login-attempt.service";
import { SessionService } from "../session.service";

describe("AuthService", () => {
  const user: UserProfile = { id: "user-id", email: "john@example.com", name: "John" };

  let service: AuthService;
  let userService: jest.Mocked<Pick<UserService, "createUser" | "findByCredentials" | "getUserProfile">>;
  let sessionService: jest.Mocked<Pick<SessionService, "create" | "rotate" | "revoke">>;
  let loginAttemptService: jest.Mocked<Pick<LoginAttemptService, "assertNotPaused" | "recordFailure" | "reset">>;
  let jwtService: jest.Mocked<Pick<JwtService, "signAsync">>;

  beforeEach(() => {
    userService = { createUser: jest.fn(), findByCredentials: jest.fn(), getUserProfile: jest.fn() };
    sessionService = { create: jest.fn().mockResolvedValue("refresh-token"), rotate: jest.fn(), revoke: jest.fn() };
    loginAttemptService = { assertNotPaused: jest.fn(), recordFailure: jest.fn(), reset: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue("access-token") };

    service = new AuthService(
      userService as unknown as UserService,
      sessionService as unknown as SessionService,
      loginAttemptService as unknown as LoginAttemptService,
      jwtService as unknown as JwtService,
    );
  });

  describe("register", () => {
    it("creates the user and starts a session", async () => {
      userService.createUser.mockResolvedValue(user);

      await expect(service.register({ email: user.email, name: user.name, password: "P@ssw0rd!" })).resolves.toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user,
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email });
      expect(sessionService.create).toHaveBeenCalledWith(user.id);
    });
  });

  describe("login", () => {
    it("starts a session and clears past failures when the credentials match", async () => {
      userService.findByCredentials.mockResolvedValue(user);

      await expect(service.login(user.email, "P@ssw0rd!")).resolves.toMatchObject({ accessToken: "access-token", user });
      expect(loginAttemptService.reset).toHaveBeenCalledWith(user.email);
    });

    it("records the failure and answers 401 with the attempts left", async () => {
      userService.findByCredentials.mockResolvedValue(null);
      loginAttemptService.recordFailure.mockResolvedValue(2);

      const error = await service.login(user.email, "wrong").catch(e => e);

      expect(error).toBeInstanceOf(InvalidCredentialsError);
      expect(error.getResponse().message).toEqual([
        "Invalid email or password",
        "2 attempts left before sign-in is paused for 15 minutes",
      ]);
      expect(sessionService.create).not.toHaveBeenCalled();
    });

    it("does not check the password at all while the account is paused", async () => {
      loginAttemptService.assertNotPaused.mockRejectedValue(new TooManyLoginAttemptsError(600));

      await expect(service.login(user.email, "P@ssw0rd!")).rejects.toBeInstanceOf(TooManyLoginAttemptsError);
      expect(userService.findByCredentials).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("issues a new access token for the session's user", async () => {
      sessionService.rotate.mockResolvedValue({ userId: user.id, refreshToken: "rotated" });
      userService.getUserProfile.mockResolvedValue(user);

      await expect(service.refresh("refresh-token")).resolves.toEqual({ accessToken: "access-token", refreshToken: "rotated" });
    });

    it("ends the session when its user no longer exists", async () => {
      sessionService.rotate.mockResolvedValue({ userId: user.id, refreshToken: "rotated" });
      userService.getUserProfile.mockRejectedValue(new NotFoundException());

      await expect(service.refresh("refresh-token")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
      expect(sessionService.revoke).toHaveBeenCalledWith("refresh-token");
    });
  });
});

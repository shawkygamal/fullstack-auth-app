import { NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { EmailAlreadyRegisteredError } from "../errors/email-already-registered.error";
import { UserProfile } from "../interfaces/user-profile.interface";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../user.service";

// The real bcryptjs, with `hash` wrapped so a test can assert it was never called.
jest.mock("bcryptjs", () => {
  const actual = jest.requireActual<typeof import("bcryptjs")>("bcryptjs");

  return { ...actual, hash: jest.fn(actual.hash) };
});

describe("UserService", () => {
  const profile: UserProfile = { id: "user-id", email: "john@example.com", name: "John" };

  let service: UserService;
  let userRepository: jest.Mocked<Pick<UserRepository, "existsByEmail" | "create" | "findByEmailWithPasswordHash" | "findById">>;

  beforeEach(() => {
    userRepository = {
      existsByEmail: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
      findByEmailWithPasswordHash: jest.fn(),
      findById: jest.fn(),
    };
    service = new UserService(userRepository as unknown as UserRepository);
  });

  describe("createUser", () => {
    it("stores a bcrypt hash, never the plain password", async () => {
      userRepository.create.mockResolvedValue(profile);

      await service.createUser({ email: profile.email, name: profile.name, password: "P@ssw0rd!" });

      const stored = userRepository.create.mock.calls[0][0];
      expect(stored).not.toHaveProperty("password");
      await expect(bcrypt.compare("P@ssw0rd!", stored.passwordHash)).resolves.toBe(true);
    });

    it("rejects a taken email before hashing or inserting anything", async () => {
      userRepository.existsByEmail.mockResolvedValue(true);
      jest.mocked(bcrypt.hash).mockClear();

      await expect(service.createUser({ email: profile.email, name: profile.name, password: "P@ssw0rd!" })).rejects.toBeInstanceOf(
        EmailAlreadyRegisteredError,
      );
      expect(userRepository.existsByEmail).toHaveBeenCalledWith(profile.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("still rejects when a concurrent sign-up takes the email between the check and the insert", async () => {
      userRepository.create.mockRejectedValue(new EmailAlreadyRegisteredError());

      await expect(service.createUser({ email: profile.email, name: profile.name, password: "P@ssw0rd!" })).rejects.toBeInstanceOf(
        EmailAlreadyRegisteredError,
      );
    });
  });

  describe("findByCredentials", () => {
    const passwordHash = bcrypt.hashSync("P@ssw0rd!", 4);

    it("returns the profile, without the hash, when the password matches", async () => {
      userRepository.findByEmailWithPasswordHash.mockResolvedValue({ ...profile, passwordHash });

      await expect(service.findByCredentials(profile.email, "P@ssw0rd!")).resolves.toEqual(profile);
    });

    it("returns null when the password does not match", async () => {
      userRepository.findByEmailWithPasswordHash.mockResolvedValue({ ...profile, passwordHash });

      await expect(service.findByCredentials(profile.email, "wrong")).resolves.toBeNull();
    });

    it("returns null when no user has the email", async () => {
      userRepository.findByEmailWithPasswordHash.mockResolvedValue(null);

      await expect(service.findByCredentials("nobody@example.com", "P@ssw0rd!")).resolves.toBeNull();
    });
  });

  describe("getUserProfile", () => {
    it("rejects with 404 when the user no longer exists", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserProfile("missing-id")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

import { Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { PASSWORD_HASH_ROUNDS } from "./constants/user-validation.constant";
import { EmailAlreadyRegisteredError } from "./errors/email-already-registered.error";
import { CreateUser } from "./interfaces/create-user.interface";
import { UserProfile } from "./interfaces/user-profile.interface";
import { UserRepository } from "./repositories/user.repository";

@Injectable()
export class UserService {
  /** Compared against when the email is unknown, so both failures cost one bcrypt check and take as long. */
  private readonly dummyPasswordHash = bcrypt.hash("dummy-password", PASSWORD_HASH_ROUNDS);

  constructor(private readonly userRepository: UserRepository) {}

  /** @throws EmailAlreadyRegisteredError when the email is taken, including by a sign-up racing this one */
  async createUser({ email, name, password }: CreateUser): Promise<UserProfile> {
    // Checked before hashing, so a taken email costs one indexed lookup instead of a bcrypt hash.
    if (await this.userRepository.existsByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    return this.userRepository.create({ email, name, passwordHash });
  }

  /**
   * @returns the user when the credentials match, otherwise null. Neither the answer nor its timing tells an
   * unknown email from a wrong password.
   */
  async findByCredentials(email: string, password: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findByEmailWithPasswordHash(email);

    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? (await this.dummyPasswordHash));

    if (!user || !passwordMatches) {
      return null;
    }

    const { passwordHash: _, ...profile } = user;

    return profile;
  }

  async getUserProfile(id: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, isValidObjectId, mongo } from "mongoose";

import { User } from "../entities/user.entity";
import { EmailAlreadyRegisteredError } from "../errors/email-already-registered.error";
import { UserProfile, UserWithPasswordHash } from "../interfaces/user-profile.interface";

const DUPLICATE_KEY_ERROR_CODE = 11000;

type StoredUser = Pick<User, "email" | "name"> & { _id: Types.ObjectId };

/**
 * All Mongo access for users. Reads are `lean` and only project the fields they need; everything leaves
 * this class as a plain object, so no Mongoose document reaches services or serialization.
 */
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async findById(id: string): Promise<UserProfile | null> {
    // A malformed id would otherwise throw a CastError (a 500) instead of simply matching nothing.
    if (!isValidObjectId(id)) {
      return null;
    }

    const user = await this.userModel.findById(id).select("email name").lean<StoredUser>().exec();

    return user && UserRepository.toProfile(user);
  }

  async findByEmailWithPasswordHash(email: string): Promise<UserWithPasswordHash | null> {
    const user = await this.userModel
      .findOne({ email })
      .select("email name +passwordHash")
      .lean<StoredUser & Pick<User, "passwordHash">>()
      .exec();

    return user && { ...UserRepository.toProfile(user), passwordHash: user.passwordHash };
  }

  /** Served by the unique `email` index; fetches no document fields. */
  async existsByEmail(email: string): Promise<boolean> {
    return (await this.userModel.exists({ email }).exec()) !== null;
  }

  /**
   * Callers check `existsByEmail` first. The unique index still backs it up: two concurrent sign-ups can both
   * pass that check, and then the index rejects the second insert.
   */
  async create(user: Pick<User, "email" | "name" | "passwordHash">): Promise<UserProfile> {
    try {
      const created = await this.userModel.create(user);

      return UserRepository.toProfile(created);
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE) {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }

  private static toProfile({ _id, email, name }: StoredUser): UserProfile {
    return { id: _id.toString(), email, name };
  }
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Session } from "../entities/session.entity";

export interface StoredSession {
  id: string;
  userId: string;
  tokenHash: string;
  previousTokenHash?: string;
  rotatedAt?: Date;
  expiresAt: Date;
}

type LeanSession = Session & { _id: Types.ObjectId };

@Injectable()
export class SessionRepository {
  constructor(@InjectModel(Session.name) private readonly sessionModel: Model<Session>) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.sessionModel.create({ userId: new Types.ObjectId(userId), tokenHash, expiresAt });
  }

  /** The live session whose current or previous refresh token has this hash. */
  async findByAnyTokenHash(tokenHash: string, now: Date): Promise<StoredSession | null> {
    const session = await this.sessionModel
      .findOne({ $or: [{ tokenHash }, { previousTokenHash: tokenHash }], expiresAt: { $gt: now } })
      .lean<LeanSession>()
      .exec();

    return session && SessionRepository.toStoredSession(session);
  }

  /**
   * Swaps the current token for a new one, but only if it is still `currentHash`: of two concurrent rotations,
   * exactly one wins.
   *
   * @returns whether this call rotated the token
   */
  async rotate(id: string, currentHash: string, newHash: string, now: Date, expiresAt: Date): Promise<boolean> {
    const result = await this.sessionModel
      .updateOne(
        { _id: id, tokenHash: currentHash },
        { $set: { tokenHash: newHash, previousTokenHash: currentHash, rotatedAt: now, expiresAt } },
      )
      .exec();

    return result.modifiedCount === 1;
  }

  async deleteById(id: string): Promise<void> {
    await this.sessionModel.deleteOne({ _id: id }).exec();
  }

  async deleteByAnyTokenHash(tokenHash: string): Promise<void> {
    await this.sessionModel.deleteOne({ $or: [{ tokenHash }, { previousTokenHash: tokenHash }] }).exec();
  }

  private static toStoredSession({ _id, userId, tokenHash, previousTokenHash, rotatedAt, expiresAt }: LeanSession): StoredSession {
    return { id: _id.toString(), userId: userId.toString(), tokenHash, previousTokenHash, rotatedAt, expiresAt };
  }
}

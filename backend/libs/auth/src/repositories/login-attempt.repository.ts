import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { LoginAttempt } from "../entities/login-attempt.entity";

export type LoginAttemptState = Pick<LoginAttempt, "failures" | "expiresAt">;

@Injectable()
export class LoginAttemptRepository {
  constructor(@InjectModel(LoginAttempt.name) private readonly loginAttemptModel: Model<LoginAttempt>) {}

  /** The record while its window is still open; Mongo's TTL sweep runs only once a minute. */
  findActive(email: string, now: Date): Promise<LoginAttemptState | null> {
    return this.loginAttemptModel
      .findOne({ email, expiresAt: { $gt: now } })
      .select("-_id failures expiresAt")
      .lean<LoginAttemptState>()
      .exec();
  }

  /**
   * Counts one more failure in a single atomic update, so concurrent attempts cannot under-count. An expired
   * window restarts at 1; reaching `maxFailures` moves `expiresAt` to `pausedUntil`.
   */
  async incrementFailures(email: string, now: Date, windowEnd: Date, maxFailures: number, pausedUntil: Date): Promise<LoginAttemptState> {
    const isWindowOpen = { $gt: ["$expiresAt", now] };

    const state = await this.loginAttemptModel
      .findOneAndUpdate(
        { email },
        [
          {
            $set: {
              failures: { $cond: [isWindowOpen, { $add: ["$failures", 1] }, 1] },
              expiresAt: { $cond: [isWindowOpen, "$expiresAt", windowEnd] },
            },
          },
          { $set: { expiresAt: { $cond: [{ $gte: ["$failures", maxFailures] }, pausedUntil, "$expiresAt"] } } },
        ],
        // Mongoose 9 runs an array update as a pipeline only when asked to explicitly.
        { upsert: true, updatePipeline: true, returnDocument: "after", projection: { _id: 0, failures: 1, expiresAt: 1 } },
      )
      .lean<LoginAttemptState>()
      .exec();

    return state as LoginAttemptState;
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.loginAttemptModel.deleteOne({ email }).exec();
  }
}

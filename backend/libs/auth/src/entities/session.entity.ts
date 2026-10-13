import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

import { User } from "@auth-app/lib/user";

/**
 * One signed-in device. Only SHA-256 hashes of refresh tokens are stored, so a database leak yields no usable token.
 */
@Schema({ collection: "sessions", timestamps: true, versionKey: false })
export class Session {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  public userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  public tokenHash: string;

  /** The token this one replaced, kept to accept a short grace period and to detect reuse after it. */
  @Prop({ index: { sparse: true } })
  public previousTokenHash?: string;

  @Prop()
  public rotatedAt?: Date;

  /** Mongo deletes the session once this passes (TTL index). Pushed forward on every rotation. */
  @Prop({ required: true, expires: 0 })
  public expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

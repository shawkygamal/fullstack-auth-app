import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

/**
 * Failed sign-ins per email inside the current window. Kept in Mongo, not memory, so the limit holds across
 * restarts and several API instances. Recorded for unknown emails too, so the limit does not reveal which exist.
 */
@Schema({ collection: "login_attempts", versionKey: false })
export class LoginAttempt {
  @Prop({ required: true, unique: true })
  public email: string;

  @Prop({ required: true })
  public failures: number;

  /** End of the counting window, or of the pause once the limit is hit. Mongo deletes the record after it. */
  @Prop({ required: true, expires: 0 })
  public expiresAt: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

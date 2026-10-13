import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "users", timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  public email: string;

  @Prop({ required: true, trim: true })
  public name: string;

  @Prop({ required: true, select: false })
  public passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

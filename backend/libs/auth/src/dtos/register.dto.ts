import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, isString } from "class-validator";

import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_COMPLEXITY_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@auth-app/lib/user";

export class RegisterDto {
  @ApiProperty({
    type: String,
    format: "email",
    example: "john.doe@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (isString(value) ? value.toLowerCase().trim() : value))
  public readonly email: string;

  @ApiProperty({
    type: String,
    minLength: NAME_MIN_LENGTH,
    example: "John Doe",
  })
  @IsString()
  @MinLength(NAME_MIN_LENGTH)
  @MaxLength(NAME_MAX_LENGTH)
  @Transform(({ value }) => (isString(value) ? value.trim() : value))
  public readonly name: string;

  @ApiProperty({
    type: String,
    format: "password",
    minLength: PASSWORD_MIN_LENGTH,
    description: "At least 8 characters, with at least one letter, one number and one special character",
    example: "P@ssw0rd!",
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_PATTERN, {
    message: "password must contain at least one letter, one number and one special character",
  })
  public readonly password: string;
}

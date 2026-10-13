import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, isString } from "class-validator";

export class LoginDto {
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
    format: "password",
    example: "P@ssw0rd!",
  })
  @IsNotEmpty()
  @IsString()
  public readonly password: string;
}

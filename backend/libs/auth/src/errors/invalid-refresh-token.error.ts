import { UnauthorizedException } from "@nestjs/common";

export class InvalidRefreshTokenError extends UnauthorizedException {
  constructor() {
    super("Your session has expired, please sign in again");
  }
}

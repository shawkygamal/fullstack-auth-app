import { ConflictException } from "@nestjs/common";

export class EmailAlreadyRegisteredError extends ConflictException {
  constructor() {
    super("This email is already registered");
  }
}

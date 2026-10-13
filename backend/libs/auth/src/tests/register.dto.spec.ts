import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { RegisterDto } from "../dtos/register.dto";

const VALID = { email: "john@example.com", name: "John", password: "P@ssw0rd!" };

async function errorsFor(body: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(RegisterDto, body));

  return errors.map(error => error.property);
}

describe("RegisterDto", () => {
  it("accepts a valid body", async () => {
    expect(await errorsFor(VALID)).toEqual([]);
  });

  it("normalizes the email to lowercase without surrounding spaces", () => {
    expect(plainToInstance(RegisterDto, { ...VALID, email: "  John@Example.COM " }).email).toBe("john@example.com");
  });

  it("rejects an invalid email", async () => {
    expect(await errorsFor({ ...VALID, email: "not-an-email" })).toEqual(["email"]);
  });

  it.each(["Jo", "   Jo   "])("rejects a name shorter than 3 characters (%p)", async name => {
    expect(await errorsFor({ ...VALID, name })).toEqual(["name"]);
  });

  it.each([
    ["shorter than 8 characters", "P@ss1"],
    ["without a letter", "12345678!"],
    ["without a number", "Password!"],
    ["without a special character", "Passw0rd"],
    ["longer than bcrypt can hash", `P@ssw0rd${"a".repeat(70)}`],
  ])("rejects a password %s", async (_, password) => {
    expect(await errorsFor({ ...VALID, password })).toEqual(["password"]);
  });
});

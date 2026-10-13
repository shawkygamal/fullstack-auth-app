import { maskEmail } from "../utils/mask-email";

describe("maskEmail", () => {
  it("keeps the first character and the domain", () => {
    expect(maskEmail("john.doe@example.com")).toBe("j***@example.com");
  });

  it("hides anything that is not a usable address", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("@example.com")).toBe("***");
  });
});

import { describe, it, expect } from "vitest";
import { inviteClientSchema } from "@/schema/invite-client";

describe("inviteClientSchema", () => {
  it("accepts valid email", () => {
    const result = inviteClientSchema.safeParse({
      email: "client@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts email with subdomain", () => {
    const result = inviteClientSchema.safeParse({
      email: "user@mail.company.org",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email (missing @)", () => {
    const result = inviteClientSchema.safeParse({ email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email (missing domain)", () => {
    const result = inviteClientSchema.safeParse({ email: "user@" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = inviteClientSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email field", () => {
    const result = inviteClientSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string email", () => {
    const result = inviteClientSchema.safeParse({ email: 12345 });
    expect(result.success).toBe(false);
  });
});

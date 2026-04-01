import { describe, it, expect } from "vitest";
import { clientApplicationSchema } from "@/schema/client-application";

const pastDate = new Date("1990-06-15");
const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

const baseClientData = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  birthdate: pastDate,
  gender: "Female" as const,
  phoneNumber: "555-867-5309",
  ssn: "123-45-6789",
  registrationType: "client" as const,
  password: "SecurePass1!",
};

describe("clientApplicationSchema", () => {
  it("accepts valid client registration data", () => {
    const result = clientApplicationSchema.safeParse(baseClientData);
    expect(result.success).toBe(true);
  });

  it("rejects future birthdate", () => {
    const result = clientApplicationSchema.safeParse({
      ...baseClientData,
      birthdate: futureDate,
    });
    expect(result.success).toBe(false);
  });

  it("requires password when registrationType is client", () => {
    const result = clientApplicationSchema.safeParse({
      ...baseClientData,
      registrationType: "client",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("password optional when registrationType is admin", () => {
    const result = clientApplicationSchema.safeParse({
      ...baseClientData,
      registrationType: "admin",
      password: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("password optional when registrationType is broker", () => {
    const result = clientApplicationSchema.safeParse({
      ...baseClientData,
      registrationType: "broker",
      password: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing firstName", () => {
    const { firstName: _, ...rest } = baseClientData;
    expect(clientApplicationSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing lastName", () => {
    const { lastName: _, ...rest } = baseClientData;
    expect(clientApplicationSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      clientApplicationSchema.safeParse({
        ...baseClientData,
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid gender", () => {
    expect(
      clientApplicationSchema.safeParse({
        ...baseClientData,
        gender: "Unknown",
      }).success,
    ).toBe(false);
  });

  it("rejects missing phoneNumber", () => {
    const { phoneNumber: _, ...rest } = baseClientData;
    expect(clientApplicationSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid SSN format", () => {
    expect(
      clientApplicationSchema.safeParse({
        ...baseClientData,
        ssn: "123456789",
      }).success,
    ).toBe(false);
  });

  it("accepts valid birthdate exactly today (boundary)", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = clientApplicationSchema.safeParse({
      ...baseClientData,
      birthdate: today,
    });
    expect(result.success).toBe(true);
  });
});

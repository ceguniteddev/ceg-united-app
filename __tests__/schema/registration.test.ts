import { describe, it, expect } from "vitest";
import {
  ssnSchema,
  passwordSchema,
  registrationSchema,
  UserActiveStatusEnum,
} from "@/schema/registration";

describe("ssnSchema", () => {
  it("should accept a valid SSN", () => {
    expect(ssnSchema.safeParse("123-45-6789").success).toBe(true);
  });

  it("should reject SSN without dashes", () => {
    expect(ssnSchema.safeParse("123456789").success).toBe(false);
  });

  it("should reject SSN with wrong format", () => {
    expect(ssnSchema.safeParse("12-345-6789").success).toBe(false);
    expect(ssnSchema.safeParse("123-456-789").success).toBe(false);
  });

  it("should reject area 000", () => {
    expect(ssnSchema.safeParse("000-45-6789").success).toBe(false);
  });

  it("should reject area 666", () => {
    expect(ssnSchema.safeParse("666-45-6789").success).toBe(false);
  });

  it("should reject area 900-999", () => {
    expect(ssnSchema.safeParse("900-45-6789").success).toBe(false);
    expect(ssnSchema.safeParse("999-45-6789").success).toBe(false);
  });

  it("should reject group 00", () => {
    expect(ssnSchema.safeParse("123-00-6789").success).toBe(false);
  });

  it("should reject serial 0000", () => {
    expect(ssnSchema.safeParse("123-45-0000").success).toBe(false);
  });

  it("should transform to canonical AAA-GG-SSSS format", () => {
    const result = ssnSchema.safeParse("123-45-6789");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("123-45-6789");
    }
  });

  it("should trim whitespace before validation", () => {
    expect(ssnSchema.safeParse("  123-45-6789  ").success).toBe(true);
  });

  it("should reject an empty string", () => {
    expect(ssnSchema.safeParse("").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("should accept a strong password", () => {
    expect(passwordSchema.safeParse("Str0ng!Pass").success).toBe(true);
  });

  it("should reject passwords shorter than 8 characters", () => {
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
  });

  it("should require an uppercase letter", () => {
    expect(passwordSchema.safeParse("str0ng!pass").success).toBe(false);
  });

  it("should require a lowercase letter", () => {
    expect(passwordSchema.safeParse("STR0NG!PASS").success).toBe(false);
  });

  it("should require a numeric character", () => {
    expect(passwordSchema.safeParse("Strong!Pass").success).toBe(false);
  });

  it("should require a special character", () => {
    expect(passwordSchema.safeParse("Str0ngPass").success).toBe(false);
  });

  it("should accept various special characters", () => {
    expect(passwordSchema.safeParse("Passw0rd@").success).toBe(true);
    expect(passwordSchema.safeParse("Passw0rd#").success).toBe(true);
    expect(passwordSchema.safeParse("Passw0rd$").success).toBe(true);
  });

  it("should accept exactly 8 characters meeting all criteria", () => {
    expect(passwordSchema.safeParse("Ab1!defg").success).toBe(true);
  });
});

describe("UserActiveStatusEnum", () => {
  it("should accept Active", () => {
    expect(UserActiveStatusEnum.safeParse("Active").success).toBe(true);
  });

  it("should accept InActive", () => {
    expect(UserActiveStatusEnum.safeParse("InActive").success).toBe(true);
  });

  it("should accept Paused", () => {
    expect(UserActiveStatusEnum.safeParse("Paused").success).toBe(true);
  });

  it("should reject unknown statuses", () => {
    expect(UserActiveStatusEnum.safeParse("Banned").success).toBe(false);
    expect(UserActiveStatusEnum.safeParse("").success).toBe(false);
  });
});

describe("registrationSchema", () => {
  const validRegistration = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phoneNumber: "555-123-4567",
    ssn: "234-56-7890",
  };

  it("should accept a valid registration", () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("should reject missing firstName", () => {
    const { firstName, ...rest } = validRegistration;
    expect(registrationSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject missing lastName", () => {
    const { lastName, ...rest } = validRegistration;
    expect(registrationSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject an invalid email", () => {
    expect(
      registrationSchema.safeParse({
        ...validRegistration,
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("should reject an invalid SSN", () => {
    expect(
      registrationSchema.safeParse({ ...validRegistration, ssn: "000-00-0000" })
        .success,
    ).toBe(false);
  });

  it("should allow optional password to be absent", () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("should reject an invalid password when provided", () => {
    expect(
      registrationSchema.safeParse({
        ...validRegistration,
        password: "weak",
      }).success,
    ).toBe(false);
  });

  it("should accept an empty string for password (optional)", () => {
    expect(
      registrationSchema.safeParse({
        ...validRegistration,
        password: "",
      }).success,
    ).toBe(true);
  });

  it("should coerce commissionRate from string to number", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      commissionRate: "15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commissionRate).toBe(15);
    }
  });

  it("should reject commissionRate above 100", () => {
    expect(
      registrationSchema.safeParse({
        ...validRegistration,
        commissionRate: 150,
      }).success,
    ).toBe(false);
  });

  it("should reject commissionRate below 0", () => {
    expect(
      registrationSchema.safeParse({
        ...validRegistration,
        commissionRate: -5,
      }).success,
    ).toBe(false);
  });
});

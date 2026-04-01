import { describe, it, expect } from "vitest";
import {
  ROLESEnum,
  GenderEnum,
  genderTypes,
  dateOfBirthSchema,
  RequestCallStatusEnum,
  requestCallSchema,
  getRequestCallStatus,
  businessRecordSchema,
} from "@/schema/index";

describe("ROLESEnum", () => {
  it("should accept Admin", () => {
    expect(ROLESEnum.safeParse("Admin").success).toBe(true);
  });

  it("should accept Broker", () => {
    expect(ROLESEnum.safeParse("Broker").success).toBe(true);
  });

  it("should accept Client", () => {
    expect(ROLESEnum.safeParse("Client").success).toBe(true);
  });

  it("should reject unknown roles", () => {
    expect(ROLESEnum.safeParse("SuperAdmin").success).toBe(false);
    expect(ROLESEnum.safeParse("").success).toBe(false);
  });
});

describe("GenderEnum", () => {
  it("should accept Male", () => {
    expect(GenderEnum.safeParse("Male").success).toBe(true);
  });

  it("should accept Female", () => {
    expect(GenderEnum.safeParse("Female").success).toBe(true);
  });

  it("should accept Other", () => {
    expect(GenderEnum.safeParse("Other").success).toBe(true);
  });

  it("should reject invalid genders", () => {
    expect(GenderEnum.safeParse("Unknown").success).toBe(false);
    expect(GenderEnum.safeParse("").success).toBe(false);
  });
});

describe("genderTypes()", () => {
  it("should return an array of {value, label} objects", () => {
    const types = genderTypes();
    expect(Array.isArray(types)).toBe(true);
    types.forEach((t) => {
      expect(t).toHaveProperty("value");
      expect(t).toHaveProperty("label");
    });
  });

  it("should include Male, Female, Other", () => {
    const values = genderTypes().map((t) => t.value);
    expect(values).toContain("Male");
    expect(values).toContain("Female");
    expect(values).toContain("Other");
  });
});

describe("dateOfBirthSchema", () => {
  it("should accept a past date string", () => {
    const result = dateOfBirthSchema.safeParse("1990-01-01");
    expect(result.success).toBe(true);
  });

  it("should accept a Date object in the past", () => {
    const result = dateOfBirthSchema.safeParse(new Date("1985-06-15"));
    expect(result.success).toBe(true);
  });

  it("should reject a future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = dateOfBirthSchema.safeParse(future);
    expect(result.success).toBe(false);
  });

  it("should coerce a valid ISO string to Date", () => {
    const result = dateOfBirthSchema.safeParse("2000-03-15");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
    }
  });

  it("should reject an invalid date string", () => {
    const result = dateOfBirthSchema.safeParse("not-a-date");
    expect(result.success).toBe(false);
  });
});

describe("RequestCallStatusEnum", () => {
  it("should accept Open", () => {
    expect(RequestCallStatusEnum.safeParse("Open").success).toBe(true);
  });

  it("should accept Pending", () => {
    expect(RequestCallStatusEnum.safeParse("Pending").success).toBe(true);
  });

  it("should accept Resolved", () => {
    expect(RequestCallStatusEnum.safeParse("Resolved").success).toBe(true);
  });

  it("should reject invalid statuses", () => {
    expect(RequestCallStatusEnum.safeParse("Closed").success).toBe(false);
  });
});

describe("getRequestCallStatus()", () => {
  it("should return value/label pairs for each status", () => {
    const statuses = getRequestCallStatus();
    expect(statuses.length).toBeGreaterThan(0);
    statuses.forEach((s) => {
      expect(s).toHaveProperty("value");
      expect(s).toHaveProperty("label");
    });
  });
});

describe("requestCallSchema", () => {
  const valid = {
    fullName: "John Doe",
    email: "john@example.com",
    phoneNumber: "555-1234",
    message: "I need help",
    status: "Open" as const,
  };

  it("should accept a valid request call", () => {
    expect(requestCallSchema.safeParse(valid).success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const { fullName, ...rest } = valid;
    expect(requestCallSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject an invalid email", () => {
    expect(
      requestCallSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("should reject an invalid status", () => {
    expect(
      requestCallSchema.safeParse({ ...valid, status: "Done" }).success,
    ).toBe(false);
  });

  it("should allow optional id field", () => {
    const withId = { ...valid, id: "abc123" };
    expect(requestCallSchema.safeParse(withId).success).toBe(true);
  });

  it("should allow optional remarks field", () => {
    const withRemarks = { ...valid, remarks: "Some remarks" };
    expect(requestCallSchema.safeParse(withRemarks).success).toBe(true);
  });
});

describe("businessRecordSchema", () => {
  const validBusiness = {
    businessName: "Acme Corp",
    businessStreetAddress: "123 Main St",
    businessCityAddress: "Springfield",
    businessStateAddress: "IL",
    businessPostalAddress: "62701",
    employerIdentificationNumber: "12-3456789",
    businessPhoneNumber: "555-000-1234",
    businessEmail: "contact@acme.com",
  };

  it("should accept a valid business record", () => {
    expect(businessRecordSchema.safeParse(validBusiness).success).toBe(true);
  });

  it("should reject missing businessName", () => {
    const { businessName, ...rest } = validBusiness;
    expect(businessRecordSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject an invalid email", () => {
    const data = { ...validBusiness, businessEmail: "bad-email" };
    expect(businessRecordSchema.safeParse(data).success).toBe(false);
  });

  it("should allow optional fields to be absent", () => {
    // businessWebsite and socialMedia are optional
    expect(businessRecordSchema.safeParse(validBusiness).success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  FundingApplicationSatusEnum,
  FundingApplicationTypeEnum,
  getFundingApplicationType,
  fundingApplicationApproveDeclineSchema,
  employmentSchema,
} from "@/schema/apply-funding";

describe("FundingApplicationSatusEnum", () => {
  it.each(["New", "Processing", "Pre-Approved", "Approved", "Declined"])(
    "accepts %s",
    (value) => {
      const result = FundingApplicationSatusEnum.safeParse(value);
      expect(result.success).toBe(true);
    },
  );

  it("rejects invalid status", () => {
    expect(FundingApplicationSatusEnum.safeParse("Rejected").success).toBe(
      false,
    );
    expect(FundingApplicationSatusEnum.safeParse("").success).toBe(false);
    expect(FundingApplicationSatusEnum.safeParse(null).success).toBe(false);
  });
});

describe("FundingApplicationTypeEnum", () => {
  const validTypes = [
    "Personal",
    "Business",
    "Personal And Business",
    "Equipment Financing",
    "Income",
    "Community",
    "Tradelines",
  ];

  it.each(validTypes)("accepts %s", (value) => {
    expect(FundingApplicationTypeEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(FundingApplicationTypeEnum.safeParse("Other").success).toBe(false);
    expect(FundingApplicationTypeEnum.safeParse("").success).toBe(false);
  });
});

describe("getFundingApplicationType", () => {
  it("returns array of {value, label} objects", () => {
    const types = getFundingApplicationType();
    expect(Array.isArray(types)).toBe(true);
    types.forEach((item) => {
      expect(item).toHaveProperty("value");
      expect(item).toHaveProperty("label");
      expect(item.value).toBe(item.label);
    });
  });

  it("includes all 7 funding types", () => {
    const types = getFundingApplicationType();
    expect(types).toHaveLength(7);
    const values = types.map((t) => t.value);
    expect(values).toContain("Personal");
    expect(values).toContain("Business");
    expect(values).toContain("Personal And Business");
    expect(values).toContain("Equipment Financing");
    expect(values).toContain("Income");
    expect(values).toContain("Community");
    expect(values).toContain("Tradelines");
  });
});

describe("fundingApplicationApproveDeclineSchema", () => {
  it("accepts valid object with amountApprove", () => {
    const result = fundingApplicationApproveDeclineSchema.safeParse({
      amountApprove: 100,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional remarks", () => {
    const result = fundingApplicationApproveDeclineSchema.safeParse({
      amountApprove: 500,
      remarks: "Approved with conditions",
    });
    expect(result.success).toBe(true);
  });

  it("rejects amountApprove of 0 (min 1)", () => {
    const result = fundingApplicationApproveDeclineSchema.safeParse({
      amountApprove: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing amountApprove", () => {
    const result = fundingApplicationApproveDeclineSchema.safeParse({
      remarks: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amountApprove", () => {
    const result = fundingApplicationApproveDeclineSchema.safeParse({
      amountApprove: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("employmentSchema", () => {
  const validEmployment = {
    howDoYouGetPaid: "Direct Deposit",
    employmentPayPerMonth: 3000,
    employmentOccupation: "Engineer",
  };

  it("accepts valid employment data", () => {
    const result = employmentSchema.safeParse(validEmployment);
    expect(result.success).toBe(true);
  });

  it("allows optional employmentEmployerName", () => {
    const result = employmentSchema.safeParse({
      ...validEmployment,
      employmentEmployerName: "ACME Corp",
    });
    expect(result.success).toBe(true);
  });

  it("coerces string pay to number", () => {
    const result = employmentSchema.safeParse({
      ...validEmployment,
      employmentPayPerMonth: "2500",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employmentPayPerMonth).toBe(2500);
    }
  });

  it("rejects missing howDoYouGetPaid", () => {
    const { howDoYouGetPaid: _, ...rest } = validEmployment;
    expect(employmentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty howDoYouGetPaid", () => {
    expect(
      employmentSchema.safeParse({ ...validEmployment, howDoYouGetPaid: "" })
        .success,
    ).toBe(false);
  });

  it("rejects employmentPayPerMonth below min 1", () => {
    expect(
      employmentSchema.safeParse({
        ...validEmployment,
        employmentPayPerMonth: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects missing employmentOccupation", () => {
    const { employmentOccupation: _, ...rest } = validEmployment;
    expect(employmentSchema.safeParse(rest).success).toBe(false);
  });
});

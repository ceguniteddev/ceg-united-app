import { describe, it, expect } from "vitest";
import { applyFundingSchema } from "@/schema/apply-funding";

/**
 * Using fundingType: "Tradelines" and interestedProduct: "Tradelines" bypasses
 * all the complex conditional superRefine validators for a valid minimal base object.
 */
const validMinimal = {
  status: "New",
  appliedDate: new Date("2024-01-01"),
  interestedProduct: "Tradelines",
  fundingType: "Tradelines",
  addressStreet: "123 Main St",
  addressCity: "Springfield",
  addressState: "IL",
  addressPostal: "62701",
  consentConfirmTerms: true,
  consentConfirmPrivacy: true,
};

describe("applyFundingSchema", () => {
  it("accepts a valid minimal object (fundingType Tradelines bypasses conditional validators)", () => {
    expect(applyFundingSchema.safeParse(validMinimal).success).toBe(true);
  });

  it("rejects missing status", () => {
    const { status: _s, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing appliedDate", () => {
    const { appliedDate: _d, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing interestedProduct", () => {
    const { interestedProduct: _p, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects interestedProduct as empty string", () => {
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, interestedProduct: "" })
        .success,
    ).toBe(false);
  });

  it("rejects missing fundingType", () => {
    const { fundingType: _f, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts missing addressStreet", () => {
    const { addressStreet: _a, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts addressStreet as empty string", () => {
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, addressStreet: "" })
        .success,
    ).toBe(true);
  });

  it("accepts missing addressCity", () => {
    const { addressCity: _c, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts missing addressState", () => {
    const { addressState: _st, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts missing addressPostal", () => {
    const { addressPostal: _po, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects missing consentConfirmTerms", () => {
    const { consentConfirmTerms: _ct, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing consentConfirmPrivacy", () => {
    const { consentConfirmPrivacy: _cp, ...rest } = validMinimal;
    expect(applyFundingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid status value", () => {
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, status: "Unknown" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid fundingType value", () => {
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, fundingType: "Invalid" })
        .success,
    ).toBe(false);
  });

  it("coerces string date for appliedDate", () => {
    const result = applyFundingSchema.safeParse({
      ...validMinimal,
      appliedDate: "2024-06-15",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.appliedDate).toBeInstanceOf(Date);
  });

  it("accepts all valid status values", () => {
    const statuses = [
      "New",
      "Processing",
      "Pre-Approved",
      "Approved",
      "Declined",
    ] as const;
    for (const status of statuses) {
      expect(
        applyFundingSchema.safeParse({ ...validMinimal, status }).success,
      ).toBe(true);
    }
  });

  it("accepts optional personalAmountFunding as number", () => {
    const result = applyFundingSchema.safeParse({
      ...validMinimal,
      personalAmountFunding: 5000,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.personalAmountFunding).toBe(5000);
  });

  it("coerces string to number for personalAmountFunding", () => {
    const result = applyFundingSchema.safeParse({
      ...validMinimal,
      personalAmountFunding: "10000",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.personalAmountFunding).toBe(10000);
  });

  it("accepts optional businessAmountFunding", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        businessAmountFunding: 25000,
      }).success,
    ).toBe(true);
  });

  it("accepts optional businessId", () => {
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, businessId: "biz-abc" })
        .success,
    ).toBe(true);
  });

  it("accepts optional userId and referenceNumber", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        userId: "u-1",
        referenceNumber: "REF-001",
      }).success,
    ).toBe(true);
  });

  it("accepts ownershipPercentage 0 to 100", () => {
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, ownershipPercentage: 0 })
        .success,
    ).toBe(true);
    expect(
      applyFundingSchema.safeParse({ ...validMinimal, ownershipPercentage: 51 })
        .success,
    ).toBe(true);
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        ownershipPercentage: 100,
      }).success,
    ).toBe(true);
  });

  it("rejects ownershipPercentage over 100", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        ownershipPercentage: 101,
      }).success,
    ).toBe(false);
  });

  it("accepts businessPropertyType enum values and empty string", () => {
    for (const val of ["Lease", "Own", ""]) {
      expect(
        applyFundingSchema.safeParse({
          ...validMinimal,
          businessPropertyType: val,
        }).success,
      ).toBe(true);
    }
  });

  it("accepts isSeasonalBusiness and hasOutstandingAdvances enum values", () => {
    for (const val of ["Yes", "No", ""]) {
      expect(
        applyFundingSchema.safeParse({
          ...validMinimal,
          isSeasonalBusiness: val,
        }).success,
      ).toBe(true);
      expect(
        applyFundingSchema.safeParse({
          ...validMinimal,
          hasOutstandingAdvances: val,
        }).success,
      ).toBe(true);
    }
  });

  it("accepts vehicleFinancingType enum values and empty string", () => {
    for (const val of ["Personal", "Business", ""]) {
      expect(
        applyFundingSchema.safeParse({
          ...validMinimal,
          vehicleFinancingType: val,
        }).success,
      ).toBe(true);
    }
  });

  it("accepts driverLicense fields with Tradelines product (no DL doc required)", () => {
    const result = applyFundingSchema.safeParse({
      ...validMinimal,
      driverLicenseNumber: "DL12345",
      driverLicenseState: "IL",
      driverLicenseIssueDate: "2020-01-01",
      driverLicenseIssueExpiryDate: "2028-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data.driverLicenseIssueDate).toBeInstanceOf(Date);
  });

  it("requires driverLicenseDocuments for non-Tradelines product", () => {
    const result = applyFundingSchema.safeParse({
      ...validMinimal,
      interestedProduct: "Personal Loan",
    });
    expect(result.success).toBe(false);
  });

  it("accepts non-Tradelines product when driverLicenseDocuments is provided", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        interestedProduct: "Personal Loan",
        driverLicenseDocuments: [
          { name: "dl.jpg", size: 1024, type: "image/jpeg", base64: "abc==" },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts optional business revenue fields", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        businessGrossProjectedRevenue1: 100000,
        businessProjectedProfit1: 20000,
      }).success,
    ).toBe(true);
  });

  it("accepts businessFiledWithIRS boolean fields", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        businessFiledWithIRS1: true,
        businessFiledWithIRS2: false,
      }).success,
    ).toBe(true);
  });

  it("requires personalAmountFunding when fundingType is Personal", () => {
    const result = applyFundingSchema.safeParse({
      ...validMinimal,
      fundingType: "Personal",
    });
    expect(result.success).toBe(false);
  });

  it("accepts full Tradelines object with optional fields", () => {
    expect(
      applyFundingSchema.safeParse({
        ...validMinimal,
        userId: "user-123",
        referenceNumber: "REF-001",
        businessId: "biz-123",
        businessName: "Acme Corp",
        whoReferredYou: "friend",
        fundingProducts: ["Tradelines Package"],
      }).success,
    ).toBe(true);
  });
});

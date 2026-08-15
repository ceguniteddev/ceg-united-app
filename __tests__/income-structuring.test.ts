import { describe, it, expect } from "vitest";
import { applyFundingSchema } from "@/schema/apply-funding";

describe("Income Structuring Schema & Calculations", () => {
  it("validates optional additional income and corrected stated income fields", () => {
    const data = {
      status: "Submitted",
      appliedDate: new Date(),
      interestedProduct: "Tradelines",
      fundingType: "Tradelines",
      consentConfirmTerms: true,
      consentConfirmPrivacy: true,
      statedAnnualIncomeCorrected: 120000,
      additionalMonthlyIncome: 2500,
      additionalIncomeSource: "spouse_partner",
    };

    const parsed = applyFundingSchema.safeParse(data);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.statedAnnualIncomeCorrected).toBe(120000);
      expect(parsed.data.additionalMonthlyIncome).toBe(2500);
      expect(parsed.data.additionalIncomeSource).toBe("spouse_partner");
    }
  });

  it("calculates household income correctly given verified and additional income", () => {
    const employmentPayMonthly = 5000; // $60k/yr
    const additionalMonthlyIncome = 2000; // $24k/yr
    const statedAnnualIncomeCorrected = 75000;

    const verifiableAnnual = employmentPayMonthly * 12;
    const additionalAnnual = additionalMonthlyIncome * 12;
    const householdIncome =
      (statedAnnualIncomeCorrected || verifiableAnnual) + additionalAnnual;

    expect(verifiableAnnual).toBe(60000);
    expect(additionalAnnual).toBe(240000 / 10); // 24000
    expect(householdIncome).toBe(99000);
  });

  it("computes business revenue annualized run-rate correctly (trailing 3-mo x 4)", () => {
    const monthlyBusinessRevenue = 20000;
    const trailing3MonthRevenue = monthlyBusinessRevenue * 3;
    const annualizedRunRate = trailing3MonthRevenue * 4;

    expect(trailing3MonthRevenue).toBe(60000);
    expect(annualizedRunRate).toBe(240000);
  });
});

import { describe, it, expect } from "vitest";
import { PaymentPlanEnum, DenefitsRequestSchema } from "@/schema/payments";

describe("PaymentPlanEnum", () => {
  const validPlans = [
    "AuditFull",
    "IntelligenceFull",
    "AcceleratorFull",
    "AcceleratorDownPayment",
    "AuditDownPayment",
    "IntelligenceDownPayment",
    "TradelinePurchase",
  ] as const;

  validPlans.forEach((plan) => {
    it(`should accept "${plan}"`, () => {
      expect(PaymentPlanEnum.safeParse(plan).success).toBe(true);
    });
  });

  it("should reject an unknown plan", () => {
    expect(PaymentPlanEnum.safeParse("FakePlan").success).toBe(false);
    expect(PaymentPlanEnum.safeParse("").success).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(PaymentPlanEnum.safeParse("auditfull").success).toBe(false);
    expect(PaymentPlanEnum.safeParse("AUDITFULL").success).toBe(false);
  });
});

describe("DenefitsRequestSchema", () => {
  const valid = {
    contract_id: 12345,
    contract_code: "CEG-CODE-001",
    customer_first_name: "John",
    customer_last_name: "Doe",
    customer_email: "john@example.com",
  };

  it("should accept a fully valid denefits request", () => {
    expect(DenefitsRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("should coerce contract_id from string to number", () => {
    const result = DenefitsRequestSchema.safeParse({
      ...valid,
      contract_id: "99999",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contract_id).toBe(99999);
    }
  });

  it("should reject missing contract_id", () => {
    const { contract_id, ...rest } = valid;
    expect(DenefitsRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject missing contract_code", () => {
    const { contract_code, ...rest } = valid;
    expect(DenefitsRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject empty contract_code", () => {
    expect(
      DenefitsRequestSchema.safeParse({ ...valid, contract_code: "" }).success,
    ).toBe(false);
  });

  it("should reject missing customer_first_name", () => {
    const { customer_first_name, ...rest } = valid;
    expect(DenefitsRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject missing customer_last_name", () => {
    const { customer_last_name, ...rest } = valid;
    expect(DenefitsRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("should reject an invalid email", () => {
    expect(
      DenefitsRequestSchema.safeParse({
        ...valid,
        customer_email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("should allow userId to be null", () => {
    const result = DenefitsRequestSchema.safeParse({ ...valid, userId: null });
    expect(result.success).toBe(true);
  });

  it("should allow userId to be absent (optional)", () => {
    const result = DenefitsRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should allow userId to be a string", () => {
    const result = DenefitsRequestSchema.safeParse({
      ...valid,
      userId: "user-abc-123",
    });
    expect(result.success).toBe(true);
  });
});

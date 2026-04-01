import { describe, it, expect } from "vitest";
import {
  SpecialDealTagEnum,
  SpecialDealSchema,
  SpecialDealFormSchema,
} from "@/schema/special-deals";

describe("SpecialDealTagEnum", () => {
  it.each(["Flash Sale", "Limited Time", "Best Value"])(
    "accepts %s",
    (value) => {
      expect(SpecialDealTagEnum.safeParse(value).success).toBe(true);
    },
  );

  it("rejects invalid tag", () => {
    expect(SpecialDealTagEnum.safeParse("Clearance").success).toBe(false);
    expect(SpecialDealTagEnum.safeParse("").success).toBe(false);
  });
});

describe("SpecialDealSchema", () => {
  const validDeal = {
    bank_name: "Chase Bank",
    card_id: "chase-sapphire-001",
    credit_limit: 10000,
    date_opened: "2024-01-01",
    stock: 5,
    base_price: 499,
    tag: "Flash Sale" as const,
    discountPercent: 20,
    originalPrice: 499,
    salePrice: 399,
    expiresAt: new Date("2025-12-31"),
    isActive: true,
  };

  it("accepts valid deal", () => {
    const result = SpecialDealSchema.safeParse(validDeal);
    expect(result.success).toBe(true);
  });

  it("rejects non-positive credit_limit", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, credit_limit: 0 }).success,
    ).toBe(false);
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, credit_limit: -100 }).success,
    ).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, stock: -1 }).success,
    ).toBe(false);
  });

  it("accepts zero stock (nonnegative)", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, stock: 0 }).success,
    ).toBe(true);
  });

  it("rejects non-positive base_price", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, base_price: 0 }).success,
    ).toBe(false);
  });

  it("rejects discountPercent below 1", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, discountPercent: 0 }).success,
    ).toBe(false);
  });

  it("rejects discountPercent above 99", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, discountPercent: 100 })
        .success,
    ).toBe(false);
  });

  it("rejects non-positive originalPrice", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, originalPrice: 0 }).success,
    ).toBe(false);
  });

  it("rejects non-positive salePrice", () => {
    expect(
      SpecialDealSchema.safeParse({ ...validDeal, salePrice: 0 }).success,
    ).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { bank_name: _, ...rest } = validDeal;
    expect(SpecialDealSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts string for expiresAt (union with string)", () => {
    expect(
      SpecialDealSchema.safeParse({
        ...validDeal,
        expiresAt: "2025-12-31",
      }).success,
    ).toBe(true);
  });
});

describe("SpecialDealFormSchema", () => {
  const validForm = {
    bank_name: "Bank of America",
    card_id: "boa-cash-rewards-001",
    credit_limit: 5000,
    date_opened: "2024-03-15",
    stock: 3,
    base_price: 299,
    tag: "Best Value" as const,
    discountPercent: 15,
    originalPrice: 299,
    expiresAt: new Date("2026-06-30"),
  };

  it("accepts valid form data", () => {
    const result = SpecialDealFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it("salePrice is optional", () => {
    const withSalePrice = SpecialDealFormSchema.safeParse({
      ...validForm,
      salePrice: 254,
    });
    expect(withSalePrice.success).toBe(true);

    const withoutSalePrice = SpecialDealFormSchema.safeParse(validForm);
    expect(withoutSalePrice.success).toBe(true);
  });

  it("discountPercent max is 100", () => {
    expect(
      SpecialDealFormSchema.safeParse({ ...validForm, discountPercent: 100 })
        .success,
    ).toBe(true);
    expect(
      SpecialDealFormSchema.safeParse({ ...validForm, discountPercent: 101 })
        .success,
    ).toBe(false);
  });

  it("stock must be at least 1 (min 1)", () => {
    expect(
      SpecialDealFormSchema.safeParse({ ...validForm, stock: 0 }).success,
    ).toBe(false);
    expect(
      SpecialDealFormSchema.safeParse({ ...validForm, stock: 1 }).success,
    ).toBe(true);
  });

  it("expiresAt coerced from string to date", () => {
    const result = SpecialDealFormSchema.safeParse({
      ...validForm,
      expiresAt: "2026-12-31",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresAt).toBeInstanceOf(Date);
    }
  });

  it("isActive defaults to true", () => {
    const result = SpecialDealFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("rejects non-positive credit_limit", () => {
    expect(
      SpecialDealFormSchema.safeParse({ ...validForm, credit_limit: 0 })
        .success,
    ).toBe(false);
  });
});

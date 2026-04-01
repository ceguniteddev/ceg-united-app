import { describe, it, expect } from "vitest";
import { fundingProductSchema } from "@/schema/funding-products";

describe("fundingProductSchema", () => {
  it("accepts valid funding product", () => {
    const result = fundingProductSchema.safeParse({
      productName: "Business Line of Credit",
      fundingType: "Business",
    });
    expect(result.success).toBe(true);
  });

  it("allows optional id", () => {
    const withId = fundingProductSchema.safeParse({
      id: "product-123",
      productName: "Equipment Loan",
      fundingType: "Equipment Financing",
    });
    expect(withId.success).toBe(true);

    const withoutId = fundingProductSchema.safeParse({
      productName: "Personal Loan",
      fundingType: "Personal",
    });
    expect(withoutId.success).toBe(true);
  });

  it("rejects empty productName (min 1)", () => {
    const result = fundingProductSchema.safeParse({
      productName: "",
      fundingType: "Personal",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing productName", () => {
    const result = fundingProductSchema.safeParse({
      fundingType: "Business",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid fundingType", () => {
    const result = fundingProductSchema.safeParse({
      productName: "Test Product",
      fundingType: "Mortgage",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fundingType", () => {
    const result = fundingProductSchema.safeParse({
      productName: "Test Product",
    });
    expect(result.success).toBe(false);
  });

  it.each([
    "Personal",
    "Business",
    "Personal And Business",
    "Equipment Financing",
    "Income",
    "Community",
    "Tradelines",
  ])("accepts fundingType %s", (fundingType) => {
    const result = fundingProductSchema.safeParse({
      productName: "Test",
      fundingType,
    });
    expect(result.success).toBe(true);
  });
});

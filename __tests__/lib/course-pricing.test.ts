/// <reference types="vitest/globals" />

import { getCoursePricing, isCourseFree } from "@/lib/course-pricing";

describe("lib/course-pricing", () => {
  it("defaults null or undefined course to free with 0.00 price", () => {
    expect(getCoursePricing(null)).toEqual({
      basePrice: 0,
      discountPrice: null,
      effectivePrice: 0,
      isFree: true,
      hasDiscount: false,
      formattedEffectivePrice: "0.00",
      formattedBasePrice: "0.00",
    });
    expect(isCourseFree(undefined)).toBe(true);
  });

  it("handles course explicitly marked isFree=true regardless of price", () => {
    const pricing = getCoursePricing({
      isFree: true,
      price: 199.99,
      discountPrice: null,
    });
    expect(pricing.isFree).toBe(true);
    expect(pricing.effectivePrice).toBe(199.99);
  });

  it("handles course with 0 base price as free", () => {
    const pricing = getCoursePricing({
      isFree: false,
      price: 0,
      discountPrice: null,
    });
    expect(pricing.isFree).toBe(true);
    expect(pricing.effectivePrice).toBe(0);
    expect(pricing.formattedEffectivePrice).toBe("0.00");
  });

  it("handles course with 0 discountPrice as free", () => {
    const pricing = getCoursePricing({
      isFree: false,
      price: 49.99,
      discountPrice: 0,
    });
    expect(pricing.isFree).toBe(true);
    expect(pricing.hasDiscount).toBe(true);
    expect(pricing.effectivePrice).toBe(0);
    expect(pricing.formattedEffectivePrice).toBe("0.00");
    expect(pricing.formattedBasePrice).toBe("49.99");
  });

  it("handles standard paid course with regular price", () => {
    const pricing = getCoursePricing({
      isFree: false,
      price: 99,
      discountPrice: null,
    });
    expect(pricing.isFree).toBe(false);
    expect(pricing.hasDiscount).toBe(false);
    expect(pricing.effectivePrice).toBe(99);
    expect(pricing.formattedEffectivePrice).toBe("99.00");
    expect(isCourseFree({ isFree: false, price: 99 })).toBe(false);
  });

  it("handles paid course with active discount", () => {
    const pricing = getCoursePricing({
      isFree: false,
      price: 99.99,
      discountPrice: 29.99,
    });
    expect(pricing.isFree).toBe(false);
    expect(pricing.hasDiscount).toBe(true);
    expect(pricing.effectivePrice).toBe(29.99);
    expect(pricing.formattedEffectivePrice).toBe("29.99");
    expect(pricing.formattedBasePrice).toBe("99.99");
  });
});

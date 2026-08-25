export interface CoursePriceLike {
  isFree?: boolean | null;
  price?: number | null;
  discountPrice?: number | null;
}

export interface CoursePricingDetails {
  basePrice: number;
  discountPrice: number | null;
  effectivePrice: number;
  isFree: boolean;
  hasDiscount: boolean;
  formattedEffectivePrice: string;
  formattedBasePrice: string;
}

/**
 * Calculates effective price and free status for a course.
 * A course is free if `isFree` is true OR the calculated effective price is <= 0.
 */
export function getCoursePricing(
  course?: CoursePriceLike | null,
): CoursePricingDetails {
  if (!course) {
    return {
      basePrice: 0,
      discountPrice: null,
      effectivePrice: 0,
      isFree: true,
      hasDiscount: false,
      formattedEffectivePrice: "0.00",
      formattedBasePrice: "0.00",
    };
  }

  const basePrice = Math.max(0, course.price ?? 0);
  const discountPrice =
    course.discountPrice != null && course.discountPrice >= 0
      ? course.discountPrice
      : null;

  const effectivePrice = discountPrice != null ? discountPrice : basePrice;

  const isFree = Boolean(course.isFree) || effectivePrice === 0;
  const hasDiscount = discountPrice != null && discountPrice < basePrice;

  return {
    basePrice,
    discountPrice,
    effectivePrice,
    isFree,
    hasDiscount,
    formattedEffectivePrice: effectivePrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    formattedBasePrice: basePrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}

/**
 * Quick boolean check whether a course is free.
 */
export function isCourseFree(course?: CoursePriceLike | null): boolean {
  return getCoursePricing(course).isFree;
}

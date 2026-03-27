// ============================================
// Tradeline Mock Data
// ============================================
// Mock data for Credit Builder accounts and Special Deals
// until backend implementation is ready.

import type { CreditBuilderAccount, SpecialDeal } from "@/types/tradelines";

export const mockPersonalCreditBuilders: CreditBuilderAccount[] = [
  {
    id: "self-credit-builder",
    name: "Self Credit Builder Loan",
    type: "personal",
    provider: "Self Financial",
    description:
      "Build credit with a small installment loan. Payments are held in a savings account and released at the end of the term.",
    creditLimitRange: "$520 - $3,600",
    monthlyFee: "$25.00/mo",
    setupFee: "$9.00",
    reportsToBureaus: ["Experian", "TransUnion", "Equifax"],
    timeToReport: "30-60 days",
    recommended: true,
  },
  {
    id: "chime-secured-credit",
    name: "Chime Secured Credit Builder",
    type: "personal",
    provider: "Chime",
    description:
      "Use your own money as collateral. No credit check required, no annual fee, and reports to all three bureaus.",
    creditLimitRange: "$200 - $10,000",
    monthlyFee: "Free",
    setupFee: "Free",
    reportsToBureaus: ["Experian", "TransUnion", "Equifax"],
    timeToReport: "30 days",
    recommended: true,
  },
  {
    id: "opensky-secured-visa",
    name: "OpenSky Secured Visa",
    type: "personal",
    provider: "OpenSky",
    description:
      "Secured credit card with no credit check. Minimum $200 deposit, reports monthly to all three bureaus.",
    creditLimitRange: "$200 - $3,000",
    monthlyFee: "Free",
    setupFee: "$35",
    reportsToBureaus: ["Experian", "TransUnion", "Equifax"],
    timeToReport: "30-45 days",
    recommended: false,
  },
  {
    id: "grow-credit-mastercard",
    name: "Grow Credit Mastercard",
    type: "personal",
    provider: "Grow Credit",
    description:
      "Build credit by paying your streaming subscriptions. Free plan available with Netflix, Hulu, Spotify reporting.",
    creditLimitRange: "N/A (Subscription-based)",
    monthlyFee: "Free",
    setupFee: "Free",
    reportsToBureaus: ["Experian", "TransUnion", "Equifax"],
    timeToReport: "60-90 days",
    recommended: false,
  },
];

export const mockBusinessCreditBuilders: CreditBuilderAccount[] = [
  {
    id: "uline-net30",
    name: "Uline Net-30 Vendor Account",
    type: "business",
    provider: "Uline",
    description:
      "Shipping and packaging supplies. Net-30 terms with no credit check. Reports to D&B and Experian Business.",
    creditLimitRange: "$500 - $5,000",
    monthlyFee: "Free",
    setupFee: "Free",
    reportsToBureaus: ["D&B", "Experian Business"],
    timeToReport: "30-60 days",
    recommended: true,
  },
  {
    id: "quill-net30",
    name: "Quill Office Supplies Net-30",
    type: "business",
    provider: "Quill",
    description:
      "Office supplies with Net-30 payment terms. Reports to D&B. Great starter tradeline for building business credit.",
    creditLimitRange: "$500 - $2,000",
    monthlyFee: "Free",
    setupFee: "Free",
    reportsToBureaus: ["D&B"],
    timeToReport: "30-60 days",
    recommended: true,
  },
  {
    id: "grainger-industrial",
    name: "Grainger Industrial Supply",
    type: "business",
    provider: "Grainger",
    description:
      "Industrial and maintenance supplies. Net-30 terms, reports to D&B. Higher credit limits for established businesses.",
    creditLimitRange: "$1,000 - $10,000",
    monthlyFee: "Free",
    setupFee: "Free",
    reportsToBureaus: ["D&B"],
    timeToReport: "30-45 days",
    recommended: false,
  },
  {
    id: "nav-business-boost",
    name: "Nav Business Boost",
    type: "business",
    provider: "Nav",
    description:
      "Monthly subscription that reports a positive tradeline to D&B and Experian Business each month.",
    creditLimitRange: "N/A (Subscription)",
    monthlyFee: "$49.99/mo",
    setupFee: "Free",
    reportsToBureaus: ["D&B", "Experian Business"],
    timeToReport: "30 days",
    recommended: false,
  },
];

export const mockSpecialDeals: SpecialDeal[] = [
  {
    id: "deal-chase-28445",
    bankName: "Chase",
    cardId: "28445",
    creditLimit: 25000,
    dateOpened: "2012 Jan",
    originalPrice: 1750,
    salePrice: 1312.5,
    discountPercent: 25,
    stock: 1,
    expiresAt: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(), // 14 hours from now
    tag: "Flash Sale",
  },
  {
    id: "deal-amex-31200",
    bankName: "American Express",
    cardId: "31200",
    creditLimit: 35000,
    dateOpened: "2010 May",
    originalPrice: 2450,
    salePrice: 1960,
    discountPercent: 20,
    stock: 2,
    expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(), // 19 hours from now
    tag: "Limited Time",
  },
  {
    id: "deal-bofa-19837",
    bankName: "Bank of America",
    cardId: "19837",
    creditLimit: 18000,
    dateOpened: "2016 Mar",
    originalPrice: 1400,
    salePrice: 980,
    discountPercent: 30,
    stock: 3,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    tag: "Best Value",
  },
];

import { PaymentPlan } from "@/schema/payments";

export type PricingPlanType = "installments" | "one-time" | "contact";

export type PricingPlan = {
  type: PricingPlanType;
  title: string;
  price: string;
  priceSubtext: string;
  badge?: string;
  subtitle: string;
  features: string[];
  recommended?: boolean;
  whopKey?: PaymentPlan;
  isDenefits?: boolean;
  denefitsUrlEnvKey?: "audit" | "intelligence" | "accelerator";
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    type: "installments",
    title: "12 Monthly Payments",
    price: "$497",
    priceSubtext: "/mo",
    subtitle: "Finance your capital intelligence over 12 months.",
    features: [
      "150-point underwriting audit",
      "AI-generated Funding Map™",
      "Complete personal credit analysis",
      "Business credit deep-dive",
      "Credit optimization blueprint",
      "Bank relationship strategy",
      "Training & Insights Library",
    ],
    isDenefits: true,
    denefitsUrlEnvKey: "intelligence",
  },
  {
    type: "one-time",
    title: "One Payment",
    price: "$4,950",
    priceSubtext: "",
    badge: "Save $1,050",
    subtitle: "Best value — one payment, full access.",
    features: [
      "150-point underwriting audit",
      "AI-generated Funding Map™",
      "Complete personal credit analysis",
      "Business credit deep-dive",
      "Credit optimization blueprint",
      "Bank relationship strategy",
      "Training & Insights Library",
    ],
    recommended: true,
    whopKey: "IntelligenceFull",
  },
  {
    type: "contact",
    title: "Capital Accelerator",
    price: "Custom",
    priceSubtext: "",
    subtitle: "White-glove capital execution — closed by phone.",
    features: [
      "Everything in Intelligence, plus:",
      "Direct relationship banker introductions",
      "Application preparation & review",
      "Real-time underwriting support",
      "Approval negotiation assistance",
      "Exclusive program access",
      "Priority response & consultation",
    ],
  },
];

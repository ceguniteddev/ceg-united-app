import { PaymentPlan } from "@/schema/payments";

export type PricingPlan = {
  title: string;
  price: string;
  priceSubtext: string;
  subtitle: string;
  features: string[];
  recommended?: boolean;
  whopKey: PaymentPlan;
  denefitsWhopKey?: PaymentPlan; // If they need a whop down payment first
  hasDenefits: boolean;
  denefitsText: string;
  denefitsNote?: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    title: "CEG Brain™ Audit",
    price: "$2,000",
    priceSubtext: "",
    subtitle: "Clarity before capital.",
    features: [
      "Complete personal credit analysis",
      "Business credit deep-dive",
      "Bank account positioning review",
      "Initial funding capacity estimate",
      "Written strategic findings report",
    ],
    whopKey: "AuditFull",
    hasDenefits: true,
    denefitsWhopKey: "AuditDownPayment",
    denefitsText: "Finance in Installments",
    denefitsNote: "($2,000 + $500 finance charge, $750 down)",
  },
  {
    title: "CEG Brain™ Intelligence",
    price: "$5,000",
    priceSubtext: "",
    subtitle: "Strategic positioning before application.",
    features: [
      "Everything in Audit, plus:",
      "AI-generated Funding Map™",
      "150-point underwriting audit",
      "Credit optimization blueprint",
      "Tax & entity structure review",
      "Bank relationship strategy",
      "30-day positioning roadmap",
    ],
    recommended: true,
    whopKey: "IntelligenceFull",
    hasDenefits: true,
    denefitsWhopKey: "IntelligenceDownPayment",
    denefitsText: "Finance in Installments",
    denefitsNote: "($5,000 + $1,000 finance charge, $1k down)",
  },
  {
    title: "CEG Brain™ Capital Accelerator",
    price: "$15,000",
    priceSubtext: "",
    subtitle: "White-glove capital execution.",
    features: [
      "Everything in Intelligence, plus:",
      "Direct relationship banker introductions",
      "Application preparation & review",
      "Real-time underwriting support",
      "Approval negotiation assistance",
      "Exclusive program access",
      "Priority response & consultation",
    ],
    whopKey: "AcceleratorFull",
    hasDenefits: true,
    denefitsWhopKey: "AcceleratorDownPayment",
    denefitsText: "Finance in Installments",
    denefitsNote: "($15,000 + $2k finance charge, $5k down)",
  },
];

import { PaymentPlan } from "@/schema/payments";

export const PAYMENT_OPTIONS: {
  key: PaymentPlan;
  name: string;
  price: string;
  description: string;
  additionalCost?: string;
  features: string[];
  recommended: boolean;
  badge: string | null;
}[] = [
  {
    key: "FullPayment",
    name: "Payment Plan",
    price: "$15,000",
    description: "Split payment available",
    features: [
      "Saves $2,500 🚀",
      "Split your payments $2,500 a month",
      "Credit card / ACH accepted",
    ],
    recommended: true,
    badge: "Best Value",
  },
  {
    key: "FinancingPlan",
    name: "Payment Plan",
    price: "$2,500",
    description: "Down payment + Denefits plan",
    additionalCost: "+ $15,000 Denefits plan",
    features: [
      "$2,500 down payment via Whop",
      "Debit card accepted",
      "$15,000 Denefits plan included",
    ],
    recommended: false,
    badge: null,
  },
];

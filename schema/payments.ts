import z from "zod";

export const PaymentPlanEnum = z.enum([
  "AuditFull",
  "IntelligenceFull",
  "AcceleratorFull",
  "AcceleratorDownPayment",
  "AuditDownPayment",
  "IntelligenceDownPayment",
  "TradelinePurchase",
  "CreditReportFee",
  "BusinessCreditReportFee",
  "WalletTopUp",
]);

export type PaymentPlan = z.infer<typeof PaymentPlanEnum>;

export const DenefitsRequestSchema = z.object({
  contract_id: z.coerce.number<number>({ error: "Required" }),
  contract_code: z.string().min(1, { error: "Required" }),
  customer_first_name: z.string().min(1, { error: "Required" }),
  customer_last_name: z.string().min(1, { error: "Required" }),
  customer_email: z.email().min(1, { error: "Required" }),
  userId: z.string().optional().nullable(),
});

export type DenefitsRequest = z.infer<typeof DenefitsRequestSchema>;

export const DenefitsStatusEnum = z.enum(["Active", "InActive"]);

import { Payment } from "@whop/sdk/resources.js";

export type WhopPayment = Payment & {
  docId: string | null;
  userId: string | null;
  mappedEmail: string | null;
  mappedFirstName: string | null;
  mappedLastName: string | null;
};

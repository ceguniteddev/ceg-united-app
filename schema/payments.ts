import z from "zod";

export const PaymentPlanEnum = z.enum([
  "AuditFull",
  "IntelligenceFull",
  "AcceleratorFull",
  "AcceleratorDownPayment",
  "AuditDownPayment",
  "IntelligenceDownPayment",
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

// Schema for creating a Denefits proposal via API
export const DenefitsProposalRequestSchema = z.object({
  service_amount: z
    .number()
    .positive({ error: "Service amount must be positive" }),
  downpayment_amount: z
    .number()
    .min(0, { error: "Downpayment amount cannot be negative" })
    .default(0),
  end_date: z.string({ error: "End date is required (YYYY-MM-DD)" }),
  next_payment_buffer_days: z
    .number()
    .positive({ error: "Buffer days must be positive" })
    .default(30),
  months_array: z.array(z.number().positive()).default([3, 6, 9, 12]),
  interest_rate: z.string().default("20"),
  customer_email: z.email({ error: "Valid email is required" }),
  customer_first_name: z.string().min(1, { error: "First name is required" }),
  customer_last_name: z.string().min(1, { error: "Last name is required" }),
  customer_mobile: z
    .string()
    .min(10, { error: "Phone must be at least 10 digits" }),
  service_array: z.array(
    z.object({
      service: z.string().min(1, { error: "Service name is required" }),
      price: z.number().positive({ error: "Service price must be positive" }),
    }),
  ),
});

export type DenefitsProposalRequest = z.infer<
  typeof DenefitsProposalRequestSchema
>;

// Schema for Denefits API response
export const DenefitsProposalResponseSchema = z.object({
  message: z.string(),
  code: z.string(),
  data: z.object({
    proposal_id: z.number(),
  }),
});

export type DenefitsProposalResponse = z.infer<
  typeof DenefitsProposalResponseSchema
>;

import { Payment } from "@whop/sdk/resources.js";

export type WhopPayment = Payment & {
  docId: string | null;
  userId: string | null;
  mappedEmail: string | null;
  mappedFirstName: string | null;
  mappedLastName: string | null;
};

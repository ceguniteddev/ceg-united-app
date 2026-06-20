import { z } from "zod";

export const PsfInvoiceStatusEnum = z.enum([
  "pending",
  "signed",
  "paid",
  "void",
]);

export const PsfInvoiceSignatureSchema = z.object({
  type: z.enum(["type", "draw"]),
  value: z.string(),
  signedAt: z.string(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
});

export const psfInvoiceSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  referenceNumber: z.string(),
  fundMappingApprovedId: z.string(),
  bankName: z.string(),
  approvedAmount: z.number(),
  successFeePercentage: z.number(),
  successFeeAmount: z.number(),
  status: PsfInvoiceStatusEnum,
  signature: PsfInvoiceSignatureSchema.optional(),
  whopCheckoutId: z.string().optional(),
  whopCheckoutUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PsfInvoice = z.infer<typeof psfInvoiceSchema>;

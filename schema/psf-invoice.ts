import { z } from "zod";

export const PsfInvoiceStatusEnum = z.enum([
  "pending",
  "signed",
  "paid",
  "void",
]);

export const PsfInvoiceTypeEnum = z.enum(["psf", "custom"]);

export const PsfInvoiceSignatureSchema = z.object({
  type: z.enum(["type", "draw"]),
  value: z.string(),
  signedAt: z.string(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
});

export const PsfInvoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(1),
  rate: z.number().min(0),
  amount: z.number().min(0),
});

export type PsfInvoiceItem = z.infer<typeof PsfInvoiceItemSchema>;

export const psfInvoiceSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  /** Discriminator: "psf" for performance-success-fee, "custom" for admin-created invoices */
  type: PsfInvoiceTypeEnum.optional(),
  /** Display title — used for custom invoices; falls back to bankName for PSF invoices */
  title: z.string().optional(),
  /** Optional description / memo for custom invoices */
  description: z.string().optional(),
  /** Standalone amount for custom invoices (replaces successFeeAmount when type is "custom") */
  amount: z.number().optional(),
  referenceNumber: z.string().optional(),
  fundMappingApprovedId: z.string().optional(),
  bankName: z.string().optional(),
  approvedAmount: z.number().optional(),
  successFeePercentage: z.number().optional(),
  successFeeAmount: z.number().optional(),
  status: PsfInvoiceStatusEnum,
  signature: PsfInvoiceSignatureSchema.optional(),
  /** Timestamp when an admin sends the invoice to the client (generates Dodo checkout) */
  sentAt: z.string().optional(),
  /** ISO date string for when the invoice was issued */
  invoiceDate: z.string().optional(),
  items: z.array(PsfInvoiceItemSchema).optional(),
  dodoCheckoutId: z.string().optional(),
  dodoCheckoutUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PsfInvoice = z.infer<typeof psfInvoiceSchema>;

import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
});

export const bankManagementSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().min(1, "Bank Name is required"),
  website: z.url("Invalid URL").optional().or(z.literal("")),
  contacts: z.array(contactSchema),
  // Success fee percentage charged to clients for this bank's products (defaults to 15%)
  successFeePercentage: z.number().min(0).max(100).optional().default(15),
  isBrokerage: z.boolean().optional(),
});

export type BankManagement = z.infer<typeof bankManagementSchema>;

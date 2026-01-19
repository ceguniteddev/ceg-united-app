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
});

export type BankManagement = z.infer<typeof bankManagementSchema>;

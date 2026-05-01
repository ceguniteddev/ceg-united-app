import { z } from "zod";

export const brokerageSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, { message: "Company Name is required" }),
  website: z
    .url({ message: "Invalid URL" })
    .optional()
    .or(z.literal("")),
  email: z.email({ message: "Invalid email address" }),
  contactNumbers: z
    .array(
      z.object({
        number: z.string().min(1, { message: "Contact number is required" }),
      }),
    )
    .default([]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Brokerage = z.infer<typeof brokerageSchema>;

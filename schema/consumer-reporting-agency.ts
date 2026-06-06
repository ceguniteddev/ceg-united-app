import { z } from "zod";

export const agencySchema = z.object({
  key: z.string().min(1, { message: "Key is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  emailAddress: z
    .string()
    .email({ message: "Invalid email address" })
    .optional()
    .or(z.literal("")),
  category: z.enum(["bureau", "cra"]),
  address: z.object({
    line1: z.string().min(1, { message: "Address Line 1 is required" }),
    line2: z.string().optional(),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    zip: z.string().min(1, { message: "Zip code is required" }),
  }),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

export type AgencySchemaForm = z.infer<typeof agencySchema>;

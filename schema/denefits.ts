import z from "zod";

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

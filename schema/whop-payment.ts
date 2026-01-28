import { z } from "zod";

export const WhopPaymentSchema = z.object({
  id: z.string(),
  status: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    username: z.string(),
  }),
  plan: z.object({
    id: z.string(),
    title: z.string(),
  }),
  line_items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      amount: z.number(),
    }),
  ),
  total: z.number(),
  created_at: z.string(),
  userId: z.string().nullable(),
});

export type WhopPayment = z.infer<typeof WhopPaymentSchema>;

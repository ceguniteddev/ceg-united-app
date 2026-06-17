import { z } from "zod";

export const WalletTransactionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  amount: z.number(), // positive for credit, negative for debit
  type: z.enum(["credit", "debit"]),
  description: z.string(),
  createdAt: z.string(), // ISO string
  paymentId: z.string().optional(), // associated payment
  metadata: z.record(z.string(), z.any()).optional(),
});

export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

export const WalletSchema = z.object({
  userId: z.string(),
  balance: z.number(),
  updatedAt: z.string(),
});

export type Wallet = z.infer<typeof WalletSchema>;

import { z } from "zod";

export const WhatsNewStatus = ["Active", "InActive"] as const;
export const WhatsNewStatusEnum = z.enum(WhatsNewStatus);

export const whatsNewSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { error: "Required" }),
  content: z.string().min(1, { error: "Required" }),
  status: z.boolean(),
  createdAt: z.date(),
});
export type WhatsNew = z.infer<typeof whatsNewSchema>;

import { z } from "zod";

export const adminInvitationSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  invitedBy: z.string().min(1, { message: "Required" }),
  invitedByName: z.string().optional(),
  token: z.string().min(1, { message: "Required" }),
  status: z.enum(["Pending", "Accepted", "Expired"]).default("Pending"),
  createdAt: z.date(),
  expiresAt: z.date(),
  acceptedAt: z.date().optional(),
});

export type AdminInvitation = z.infer<typeof adminInvitationSchema>;

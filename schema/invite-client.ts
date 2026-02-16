import { z } from "zod";

export const inviteClientSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type InviteClient = z.infer<typeof inviteClientSchema>;

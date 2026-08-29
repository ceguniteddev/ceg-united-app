import { z } from "zod";

export const mailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.string().optional(), // Base64 content
  path: z.string().optional(), // File path
  contentType: z.string().optional(),
  encoding: z.string().optional(),
});

export const mailMessageSchema = z.object({
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(mailAttachmentSchema).optional(),
});

export enum EmailJobs {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  NEW_REGISTRATION = "NEW_REGISTRATION",
  SEND_PAYMENT_LINK = "SEND_PAYMENT_LINK",
  CLIENT_INVITATION = "CLIENT_INVITATION",
  BROKER_INVITATION = "BROKER_INVITATION",
  ADMIN_INVITATION = "ADMIN_INVITATION",
  OFFER = "OFFER",
  GENERAL = "GENERAL",
  MEMBERSHIP_PAYMENT_RETRY = "MEMBERSHIP_PAYMENT_RETRY",
  MEMBERSHIP_ACCESS_ENDED = "MEMBERSHIP_ACCESS_ENDED",
}

export const triggerEmailSchema = z.object({
  to: z.union([z.email(), z.array(z.email())]),
  from: z.string().optional(),
  cc: z.union([z.email(), z.array(z.email())]).optional(),
  bcc: z.union([z.email(), z.array(z.email())]).optional(),
  replyTo: z.email().optional(),
  message: mailMessageSchema,
  template: z
    .object({
      name: z.string(),
      data: z.record(z.string(), z.any()),
    })
    .optional(),
  headers: z.record(z.string(), z.string()).optional(),
  job: z.enum(EmailJobs, {
    error: "Invalid job type",
  }),
});

export type TriggerEmail = z.infer<typeof triggerEmailSchema>;
export type MailMessage = z.infer<typeof mailMessageSchema>;
export type MailAttachment = z.infer<typeof mailAttachmentSchema>;

import { describe, it, expect } from "vitest";
import {
  mailAttachmentSchema,
  mailMessageSchema,
  triggerEmailSchema,
  EmailJobs,
} from "@/schema/trigger-email";

describe("EmailJobs enum", () => {
  it("has EMAIL_VERIFICATION", () => {
    expect(EmailJobs.EMAIL_VERIFICATION).toBe("EMAIL_VERIFICATION");
  });

  it("has NEW_REGISTRATION", () => {
    expect(EmailJobs.NEW_REGISTRATION).toBe("NEW_REGISTRATION");
  });

  it("has SEND_PAYMENT_LINK", () => {
    expect(EmailJobs.SEND_PAYMENT_LINK).toBe("SEND_PAYMENT_LINK");
  });

  it("has CLIENT_INVITATION", () => {
    expect(EmailJobs.CLIENT_INVITATION).toBe("CLIENT_INVITATION");
  });

  it("has BROKER_INVITATION", () => {
    expect(EmailJobs.BROKER_INVITATION).toBe("BROKER_INVITATION");
  });

  it("has ADMIN_INVITATION", () => {
    expect(EmailJobs.ADMIN_INVITATION).toBe("ADMIN_INVITATION");
  });

  it("has GENERAL", () => {
    expect(EmailJobs.GENERAL).toBe("GENERAL");
  });
});

describe("mailAttachmentSchema", () => {
  it("accepts object with only filename", () => {
    const result = mailAttachmentSchema.safeParse({ filename: "report.pdf" });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = mailAttachmentSchema.safeParse({
      filename: "doc.pdf",
      content: "base64encodedcontent",
      path: "/tmp/doc.pdf",
      contentType: "application/pdf",
      encoding: "base64",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing filename", () => {
    const result = mailAttachmentSchema.safeParse({
      content: "somebase64",
    });
    expect(result.success).toBe(false);
  });
});

describe("mailMessageSchema", () => {
  it("accepts object with only subject", () => {
    const result = mailMessageSchema.safeParse({ subject: "Hello" });
    expect(result.success).toBe(true);
  });

  it("accepts message with text and html", () => {
    const result = mailMessageSchema.safeParse({
      subject: "Test Email",
      text: "Plain text body",
      html: "<p>HTML body</p>",
    });
    expect(result.success).toBe(true);
  });

  it("accepts message with attachments", () => {
    const result = mailMessageSchema.safeParse({
      subject: "Email with attachment",
      attachments: [{ filename: "file.pdf" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing subject", () => {
    const result = mailMessageSchema.safeParse({
      text: "body only",
    });
    expect(result.success).toBe(false);
  });
});

describe("triggerEmailSchema", () => {
  const baseEmail = {
    to: "recipient@example.com",
    message: { subject: "Test Subject" },
    job: EmailJobs.GENERAL,
  };

  it("accepts valid email with single recipient", () => {
    const result = triggerEmailSchema.safeParse(baseEmail);
    expect(result.success).toBe(true);
  });

  it("accepts array of recipients for to field", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      to: ["user1@example.com", "user2@example.com"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email in to field", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      to: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional from field", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      from: "noreply@ceg-united.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional cc as single email", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      cc: "cc@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional bcc as array", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      bcc: ["bcc1@example.com", "bcc2@example.com"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid replyTo email", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      replyTo: "reply@example.com",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    EmailJobs.EMAIL_VERIFICATION,
    EmailJobs.NEW_REGISTRATION,
    EmailJobs.SEND_PAYMENT_LINK,
    EmailJobs.CLIENT_INVITATION,
    EmailJobs.BROKER_INVITATION,
    EmailJobs.ADMIN_INVITATION,
    EmailJobs.GENERAL,
  ])("accepts job value %s", (job) => {
    expect(triggerEmailSchema.safeParse({ ...baseEmail, job }).success).toBe(
      true,
    );
  });

  it("rejects invalid job value", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      job: "UNKNOWN_JOB",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing message", () => {
    const { message: _, ...rest } = baseEmail;
    expect(triggerEmailSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects message without subject", () => {
    const result = triggerEmailSchema.safeParse({
      ...baseEmail,
      message: { text: "body only" },
    });
    expect(result.success).toBe(false);
  });
});

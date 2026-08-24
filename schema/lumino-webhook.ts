import { z } from "zod";

export const luminoZapierWebhookPayloadSchema = z.object({
  courseId: z.string().optional().nullable(),
  customerEmail: z.string().email("Invalid customerEmail address"),
  customerName: z.string().optional().nullable(),
  paymentAmount: z.union([z.string(), z.number()]).optional().nullable(),
  paymentCreatedAt: z.string().optional().nullable(),
  paymentCurrency: z.string().optional().nullable(),
  paymentId: z.string().min(1, "paymentId cannot be empty"),
  paymentMethod: z.string().optional().nullable(),
  paymentStatus: z.string().min(1, "paymentStatus cannot be empty"),
});

export type LuminoZapierWebhookPayload = z.infer<
  typeof luminoZapierWebhookPayloadSchema
>;

/**
 * Extracts and parses a Lumino Zapier webhook payload whether sent directly as a flat object,
 * nested inside `{ body: { ... } }`, or with courseId passed via query params / alternate casing.
 */
export const parseLuminoZapierWebhookPayload = (
  raw: unknown,
  fallbackCourseId?: string | null,
): LuminoZapierWebhookPayload => {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid request body: expected a JSON object");
  }

  const obj = raw as Record<string, any>;
  const nestedBody =
    obj.body && typeof obj.body === "object" && !Array.isArray(obj.body)
      ? obj.body
      : null;

  const candidate = nestedBody ? { ...nestedBody, ...obj } : { ...obj };

  // Resolve courseId if present, but it is optional
  const rawCourseId =
    candidate.courseId ||
    candidate.course_id ||
    candidate.course ||
    candidate.productId ||
    candidate.product_id ||
    fallbackCourseId ||
    null;

  const resolvedCourseId =
    typeof rawCourseId === "string" && rawCourseId.trim().length > 0
      ? rawCourseId.trim()
      : null;

  // Resolve customerEmail aliases
  const resolvedEmail =
    candidate.customerEmail ||
    candidate.customer_email ||
    candidate.email ||
    candidate.userEmail ||
    candidate.user_email ||
    undefined;

  // Resolve paymentId aliases
  const resolvedPaymentId =
    candidate.paymentId ||
    candidate.payment_id ||
    candidate.id ||
    candidate.transactionId ||
    candidate.transaction_id ||
    undefined;

  // Resolve paymentStatus aliases
  const resolvedPaymentStatus =
    candidate.paymentStatus ||
    candidate.payment_status ||
    candidate.status ||
    "Succeeded";

  const normalized = {
    ...candidate,
    courseId: resolvedCourseId,
    customerEmail:
      typeof resolvedEmail === "string" ? resolvedEmail.trim() : resolvedEmail,
    paymentId:
      typeof resolvedPaymentId === "string"
        ? resolvedPaymentId.trim()
        : resolvedPaymentId,
    paymentStatus:
      typeof resolvedPaymentStatus === "string"
        ? resolvedPaymentStatus.trim()
        : resolvedPaymentStatus,
  };

  return luminoZapierWebhookPayloadSchema.parse(normalized);
};

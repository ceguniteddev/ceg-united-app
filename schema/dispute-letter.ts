import { z } from "zod";

// Dispute letter status enum
export const DisputeLetterStatusEnum = z.enum([
  "draft",
  "pending-review",
  "approved",
  "sent",
  "delivered",
  "responded",
  "resolved",
  "escalated",
]);
export type DisputeLetterStatus = z.infer<typeof DisputeLetterStatusEnum>;

// Dispute type enum
export const DisputeTypeEnum = z.enum(
  [
    "reinserted-account",
    "inaccurate-information",
    // "identity-theft",
    // "duplicate-account",
    // "outdated-information",
    // "incorrect-balance",
    // "incorrect-payment-history",
    // "unauthorized-inquiry",
    // "mixed-file",
    // "other",
  ],
  { error: "Please select dispute type" }
);
export type DisputeType = z.infer<typeof DisputeTypeEnum>;

// Bureau enum
export const BureauEnum = z.enum(["Equifax", "Experian", "TransUnion"]);
export type Bureau = z.infer<typeof BureauEnum>;

// Recipient type enum
export const RecipientTypeEnum = z.enum([
  "credit-bureau",
  "creditor",
  "collection-agency",
  "cfpb",
]);
export type RecipientType = z.infer<typeof RecipientTypeEnum>;

// Disputed account schema
export const DisputedAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().optional(),
  accountType: z.string().optional(), // e.g., "Credit Card", "Auto Loan"
  creditorName: z.string().min(1, "Creditor name is required"),
  balance: z.number().optional(),
  disputeReason: z.string().min(1, "Dispute reason is required"),
  additionalDetails: z.string().optional(),
  affectedBureaus: z.array(BureauEnum).min(1, "At least one bureau required"),
  originalDisputeDate: z.date().optional(), // For reinserted accounts
  previouslyRemoved: z.boolean().default(false),
});
export type DisputedAccount = z.infer<typeof DisputedAccountSchema>;

// Letter recipient schema
export const LetterRecipientSchema = z.object({
  id: z.string().optional(),
  recipientType: RecipientTypeEnum,
  name: z.string().min(1, "Recipient name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code"),
  bureau: BureauEnum.optional(), // For credit bureau recipients
  isDefault: z.boolean().default(false), // System default addresses
  createdAt: z.date().optional(),
});
export type LetterRecipient = z.infer<typeof LetterRecipientSchema>;

// Letterstream delivery details
export const LetterDeliverySchema = z.object({
  letterId: z.string().optional(), // Letterstream letter ID
  status: z.string().optional(), // delivery status from Letterstream
  trackingNumber: z.string().optional(),
  estimatedDeliveryDate: z.date().optional(),
  actualDeliveryDate: z.date().optional(),
  deliveryConfirmation: z.string().optional(),
  cost: z.number().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});
export type LetterDelivery = z.infer<typeof LetterDeliverySchema>;

// Main dispute letter schema
export const DisputeLetterSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  disputeType: DisputeTypeEnum,
  status: DisputeLetterStatusEnum.default("draft"),

  // Letter content
  letterTitle: z.string().min(1, "Letter title is required"),
  letterContent: z.string().min(1, "Letter content is required"), // HTML content
  letterContentExperian: z.string().optional(),
  letterContentTransunion: z.string().optional(),
  letterContentEquifax: z.string().optional(),

  // Disputed accounts
  // disputedAccounts: z
  //   .array(DisputedAccountSchema)
  //   .min(1, "At least one account required"),

  // Recipient information
  // recipients: z
  //   .array(LetterRecipientSchema)
  //   .min(1, "At least one recipient required"),

  // Sender information (user's address)
  // senderAddress: z.object({
  //   fullName: z.string().min(1, "Full name is required"),
  //   addressLine1: z.string().min(1, "Address is required"),
  //   addressLine2: z.string().optional(),
  //   city: z.string().min(1, "City is required"),
  //   state: z.string().min(1, "State is required"),
  //   postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code"),
  // }),

  // AI generation metadata
  aiGenerated: z.boolean().default(false),
  aiPrompt: z.string().optional(),
  templateId: z.string().optional(), // Reference to letter template used

  // Delivery tracking
  delivery: LetterDeliverySchema.optional(),

  // Follow-up tracking
  followUpDate: z.date().optional(), // Auto-set to 30 days after sent
  followUpCompleted: z.boolean().default(false),
  responseReceived: z.boolean().default(false),
  responseDate: z.date().optional(),
  responseNotes: z.string().optional(),

  // Attachments
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        url: z.string(),
        size: z.number(),
      })
    )
    .optional(),

  // Admin notes
  adminNotes: z.string().optional(),
  approvedBy: z.string().optional(), // Admin user ID
  approvedAt: z.date().optional(),

  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  sentAt: z.date().optional(),
});
export type DisputeLetter = z.infer<typeof DisputeLetterSchema>;

// Letter template schema
export const LetterTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  disputeType: DisputeTypeEnum,

  // Template content with placeholders
  templateContent: z.string().min(1, "Template content is required"),
  aiPrompt: z.string().optional(), // System prompt for AI generation

  // Placeholders info
  placeholders: z
    .array(
      z.object({
        key: z.string(), // e.g., "{ACCOUNT_NAME}"
        description: z.string(), // e.g., "Name of the disputed account"
        required: z.boolean().default(true),
      })
    )
    .optional(),

  // Template settings
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false), // Default template for this dispute type

  // Metadata
  createdBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type LetterTemplate = z.infer<typeof LetterTemplateSchema>;

// Dispute tracking schema
export const DisputeTrackingSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  letterId: z.string().min(1, "Letter ID is required"),

  // Tracking details
  disputedAccountId: z.string().optional(),
  bureau: BureauEnum,
  status: z
    .enum([
      "letter-sent",
      "under-investigation",
      "waiting-response",
      "resolved-favorable",
      "resolved-unfavorable",
      "escalated-to-cfpb",
      "closed",
    ])
    .default("letter-sent"),

  // Timeline
  initialDisputeDate: z.date(),
  responseDeadline: z.date(), // 30 days from initial dispute
  responseReceivedDate: z.date().optional(),
  resolutionDate: z.date().optional(),

  // Outcome
  outcome: z.string().optional(), // Description of the resolution
  accountRemoved: z.boolean().default(false),
  accountCorrected: z.boolean().default(false),

  // Notes and updates
  notes: z
    .array(
      z.object({
        note: z.string(),
        createdBy: z.string(), // User or Admin ID
        createdAt: z.date(),
      })
    )
    .default([]),

  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type DisputeTracking = z.infer<typeof DisputeTrackingSchema>;

// Form schemas (for UI forms)
export const DisputeLetterFormSchema = DisputeLetterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
});
export type DisputeLetterForm = z.infer<typeof DisputeLetterFormSchema>;

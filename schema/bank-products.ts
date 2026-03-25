import { z } from "zod";

export const YesNoEnum = z
  .enum(["Yes", "No", "Unknown"], { error: "Required" })
  .optional();

// Bank product application methods (what banks offer)
export const ApplicationMethodEnum = z.enum(
  ["Online", "Branch", "Referral", "Phone"],
  {
    error: "Required",
  },
);

// Client application method selection (how client chooses to apply)
export const ClientApplicationMethodEnum = z.enum(["specialist", "online"]);
export type ClientApplicationMethod = z.infer<
  typeof ClientApplicationMethodEnum
>;

export const CreditBureauEnum = z.enum(
  [
    "Experian",
    "TransUnion",
    "Equifax",
    "Dun & Bradstreet or SBFE",
    "TRW",
    "LexisNexis",
    "Clarity",
    "Experian Business",
    "Equifax Business",
  ],
  {
    error: "Required",
  },
);
export type CreditBureau = z.infer<typeof CreditBureauEnum>;

export const ClientApplicationStatusEnum = z.enum(
  [
    "Not Applied",
    "Pending",
    "Sent to Lender",
    "Approved",
    "Declined",
    "Funded",
    "Lender Skipped",
  ],
  {
    error: "Required",
  },
);

export type ClientApplicationStatus = z.infer<
  typeof ClientApplicationStatusEnum
>;

export const TaxYearsEnum = z.enum(["None", "1 Year", "2 Years", "3 Years"], {
  error: "Required",
});

// Schema for individual product criteria
export const bankProductCriteriaSchema = z.object({
  productName: z.string().min(1, "Required"),
  category: z.string().optional(), // e.g. "Personal", "Business" - useful for logic
  financingTerm: z.string().optional(),
  maximumFundingAmount: z.coerce.number<number>().optional(),
  // averageApprovalAmount: z.coerce.number<number>().optional(),
  grossFundingPercentage: z.coerce.number<number>().optional(),
  softPull: YesNoEnum.optional().or(z.literal("")),
  doubleDipAllowed: YesNoEnum.optional().or(z.literal("")),
  minimumFicoScore: z.coerce.number<number>().optional(),

  creditBureauPulled: z.array(CreditBureauEnum, { error: "Required" }),
  maximumInquiriesAllowed: z.coerce.number<number>().optional(),
  minimumNumberOfAccountsOnCredit: z.coerce.number<number>().optional(),
  // minimumCreditAgeRequired: z.string(),
  maximumDebtToIncomeRatio: z.coerce.number<number>().optional(),
  maximumDebtServiceRatio: z.coerce.number<number>().optional(),
  personalVerifiableIncomeRequired: YesNoEnum.optional().or(z.literal("")),
  // noDocumentationRequired: YesNoEnum,

  // Business Specific Fields
  businessBankStatementsRequired: YesNoEnum.optional().or(z.literal("")),
  profitAndLossStatementRequired: YesNoEnum.optional().or(z.literal("")),
  balanceSheetRequired: YesNoEnum.optional().or(z.literal("")),
  businessPlanRequired: YesNoEnum.optional().or(z.literal("")),

  membershipRequiredBeforeApplicationRequired: YesNoEnum.optional().or(
    z.literal(""),
  ),
  membershipRequiredUponApprovalRequired: YesNoEnum.optional().or(
    z.literal(""),
  ),
  accountOpeningBeforeApplicationRequired: YesNoEnum.optional().or(
    z.literal(""),
  ),
  accountOpeningAfterApprovalRequired: YesNoEnum.optional().or(z.literal("")),

  // Consolidated Tax Fields
  businessTaxesRequired: TaxYearsEnum.optional().or(z.literal("")),
  personalTaxesRequired: TaxYearsEnum.optional().or(z.literal("")),

  immigrationStatusRequirement: z.string().optional(),
  stateAvailability: z.array(z.string().min(1, "Required"), {
    error: "Required",
  }),
  applicationMethod: z.array(ApplicationMethodEnum, { error: "Required" }),
  allowsForwardingViaEmail: YesNoEnum.optional().or(z.literal("")),
  canBeFinalizedOnline: YesNoEnum.optional().or(z.literal("")),
  clientNeedsToGoToBranch: YesNoEnum.optional().or(z.literal("")),
  appointmentOnly: YesNoEnum.optional().or(z.literal("")),
  openSaturdays: YesNoEnum.optional().or(z.literal("")),

  notes: z.string().optional(),

  // webUrl: z.string().min(1, "Required"),
  priorityLevel: z.coerce
    .number<number>({ error: "Required" })
    .min(1)
    .max(5)
    .optional()
    .or(z.literal("")),

  // Dynamically calculated approval odds (0-100%)
  approvalOdds: z.number().min(0).max(100).optional(),
});

export type BankProductCriteria = z.infer<typeof bankProductCriteriaSchema>;

// Main Zod Schema (Bank Level)
export const bankDataSchema = z.object({
  id: z.string().optional(),
  isApproved: z.boolean().optional(),
  bankName: z.string().min(1, "Required"),
  underwritingNotes: z.string().optional(),

  // Array of products
  products: z
    .array(bankProductCriteriaSchema)
    .min(1, "At least one product is required"),
});
export type BankFormData = z.infer<typeof bankDataSchema>;

export type ApprovedBankFormData = BankFormData & {
  fundMappingApprovedId: string;
  clientApplicationStatus: ClientApplicationStatus;
  adminApprovedStatus?: ClientApplicationStatus;
  referenceNumber: string;
  approvedAmount: number;
  approvedRemarks: string;
  declineReason?: string;
  fundedAmount?: number;
  fundedRemarks?: string;
  userId: string;
  applicationMethod?: ClientApplicationMethod; // Track selected application method (specialist/online)
  // New fields for enhanced UI
  approvalOdds?: number; // 0-100 percentage
  rank?: number; // Ranking position for display
  ficoMin?: number; // Minimum FICO requirement (duplicates minimumFicoScore for top-level access)
  revenueMin?: number; // Minimum revenue requirement
  timeInBusiness?: string; // e.g., "6 months", "1 year", "2+ years"
  fundingRange?: string; // e.g., "$10K - $250K"
  applicationUrl?: string; // External lender application URL
  logoInitial?: string; // For LenderLogo component (e.g., "C" for Chase)
  logoBg?: string; // Background color class (e.g., "bg-blue-100")
  logoColor?: string; // Text color class (e.g., "text-blue-600")
};

import { error } from "node:console";
import { z } from "zod";

export const YesNoEnum = z.enum(["Yes", "No"], { error: "Required" });

export const ApplicationMethodEnum = z.enum(["Online", "Branch", "Referral"], {
  error: "Required",
});

export const CreditBureauEnum = z.enum(
  ["Experian", "TransUnion", "Equifax", "Dun & Bradstreet or SBFE", "TRW"],
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
  financingTerm: z.string().min(1, "Required"),
  maximumFundingAmount: z.coerce.number<number>().optional(),
  averageApprovalAmount: z.coerce.number<number>().optional(),
  grossFundingPercentage: z.coerce.number<number>().optional(),
  doubleDipAllowed: YesNoEnum,
  minimumFicoScore: z.coerce.number<number>().optional(),

  creditBureauPulled: z.array(CreditBureauEnum, { error: "Required" }),
  maximumInquiriesAllowed: z.coerce.number<number>().optional(),
  minimumNumberOfAccountsOnCredit: z.coerce.number<number>().optional(),
  minimumCreditAgeRequired: z.string(),
  minimumIncomeRequired: z.coerce.number<number>().optional(),
  maximumDebtToIncomeRatio: z.coerce.number<number>().optional(),
  maximumDebtServiceRatio: z.coerce.number<number>().optional(),
  personalVerifiableIncomeRequired: YesNoEnum,
  noDocumentationRequired: YesNoEnum,

  // Business Specific Fields
  businessBankStatementsRequired: YesNoEnum.optional(),
  profitAndLossStatementRequired: YesNoEnum.optional(),
  balanceSheetRequired: YesNoEnum.optional(),
  businessPlanRequired: YesNoEnum.optional(),

  membershipRequiredBeforeApplicationRequired: YesNoEnum,
  membershipRequiredUponApprovalRequired: YesNoEnum,
  accountOpeningBeforeApplicationRequired: YesNoEnum,
  accountOpeningAfterApprovalRequired: YesNoEnum,

  // Consolidated Tax Fields
  businessTaxesRequired: TaxYearsEnum.optional(),
  personalTaxesRequired: TaxYearsEnum,

  immigrationStatusRequirement: z.string().min(1, "Required"),
  stateAvailability: z.array(z.string().min(1, "Required"), {
    error: "Required",
  }),
  applicationMethod: z.array(ApplicationMethodEnum, { error: "Required" }),
  allowsForwardingViaEmail: YesNoEnum,
  canBeFinalizedOnline: YesNoEnum,
  clientNeedsToGoToBranch: YesNoEnum,

  // webUrl: z.string().min(1, "Required"),
  priorityLevel: z.coerce
    .number<number>({ error: "Required" })
    .min(1)
    .max(5)
    .optional()
    .or(z.literal("")),
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
  approvedAmount?: number;
  approvedRemarks?: string;
  declineReason?: string;
  fundedAmount?: number;
  fundedRemarks?: string;
  userId: string;
};

import { z } from "zod";

export const YesNoEnum = z.enum(["Yes", "No"], { error: "Required" });

export const ApplicationMethodEnum = z.enum(["Online", "Branch", "Referral"], {
  error: "Required",
});

export const CreditBureauEnum = z.enum(["Experian", "TransUnion", "Equifax"], {
  error: "Required",
});

const ClientApplicationStatus = z.enum(["Not Applied", "Pending", "Approved", "Declined"], {
  error: "Required",
});

// Main Zod Schema
export const bankDataSchema = z.object({
  id: z.string().optional(),
  isApproved: z.boolean().optional(),
  bankName: z.string().min(1, "Required"),
  productName: z.string().min(1, "Required").array(),
  // productType: z.string().min(1, "Required"),
  financingTerm: z.string().min(1, "Required"),
  underwritingNotes: z.string().optional(),
  maximumFundingAmount: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  averageApprovalAmount: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  grossFundingPercentage: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  doubleDipAllowed: YesNoEnum,
  minimumFicoScore: z.number({ error: "Numeric value is required" }),
  // .min(300, "Invalid FICO score")
  // .max(850, "Invalid FICO score"),
  creditBureauPulled: CreditBureauEnum.array(),
  maximumInquiriesAllowed: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  minimumNumberOfAccountsOnCredit: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  minimumCreditAgeRequired: z.string(),
  minimumIncomeRequired: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  maximumDebtToIncomeRatio: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  maximumDebtServiceRatio: z
    .number({ error: "Numeric value is required" })
    .positive("Must be a positive number"),
  personalVerifiableIncomeRequired: YesNoEnum,
  noDocumentationRequired: YesNoEnum,
  businessBankStatementsRequired: YesNoEnum,
  profitAndLossStatementRequired: YesNoEnum,
  balanceSheetRequired: YesNoEnum,
  businessPlanRequired: YesNoEnum,

  membershipRequiredBeforeApplicationRequired: YesNoEnum,
  membershipRequiredUponApprovalRequired: YesNoEnum,
  accountOpeningBeforeApplicationRequired: YesNoEnum,
  accountOpeningAfterApprovalRequired: YesNoEnum,

  oneYearBusinessTaxes: YesNoEnum,
  twoYearBusinessTaxes: YesNoEnum,
  threeYearBusinessTaxes: YesNoEnum,
  oneYearPersonalTaxes: YesNoEnum,
  twoYearPersonalTaxes: YesNoEnum,
  threeYearPersonalTaxes: YesNoEnum,
  immigrationStatusRequirement: z.string().min(1, "Required"),
  stateAvailability: z.string().min(1, "Required").array(),
  applicationMethod: ApplicationMethodEnum.array(),
  allowsForwardingViaEmail: YesNoEnum,
  canBeFinalizedOnline: YesNoEnum,
  clientNeedsToGoToBranch: YesNoEnum,
  contactName: z.string().min(1, "Required"),
  contactPhoneNumber: z.string().min(1, "Required"),
  contactEmail: z.email({ error: "Invalid email address" }),
  clientApplicationStatus: ClientApplicationStatus.optional(),
  webUrl: z.string().min(1, "Required"),
});
export type BankFormData = z.infer<typeof bankDataSchema>;

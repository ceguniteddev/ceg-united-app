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
  }
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
  }
);

export type ClientApplicationStatus = z.infer<
  typeof ClientApplicationStatusEnum
>;

// Main Zod Schema
export const bankDataSchema = z.object({
  id: z.string().optional(),
  isApproved: z.boolean().optional(),
  bankName: z.string().min(1, "Required"),
  productName: z.array(z.string().min(1, "Required"), { error: "Required" }),
  financingTerm: z.string().min(1, "Required"),
  underwritingNotes: z.string().optional(),
  maximumFundingAmount: z.coerce.number<number>().optional(),
  averageApprovalAmount: z.coerce.number<number>().optional(),
  grossFundingPercentage: z.coerce.number<number>().optional(),
  doubleDipAllowed: YesNoEnum,
  minimumFicoScore: z.coerce.number<number>().optional(),
  // .min(300, "Invalid FICO score")
  // .max(850, "Invalid FICO score"),
  // creditBureauPulled: CreditBureauEnum.array(),

  creditBureauPulled: z.array(CreditBureauEnum, { error: "Required" }),
  maximumInquiriesAllowed: z.coerce.number<number>().optional(),
  minimumNumberOfAccountsOnCredit: z.coerce.number<number>().optional(),
  minimumCreditAgeRequired: z.string(),
  minimumIncomeRequired: z.coerce.number<number>().optional(),
  maximumDebtToIncomeRatio: z.coerce.number<number>().optional(),
  maximumDebtServiceRatio: z.coerce.number<number>().optional(),
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
  // stateAvailability: z.string().min(1, "Required").array(),
  stateAvailability: z.array(z.string().min(1, "Required"), {
    error: "Required",
  }),
  applicationMethod: z.array(ApplicationMethodEnum, { error: "Required" }),
  allowsForwardingViaEmail: YesNoEnum,
  canBeFinalizedOnline: YesNoEnum,
  clientNeedsToGoToBranch: YesNoEnum,
  contactName: z.string().min(1, "Required"),
  contactPhoneNumber: z.string().min(1, "Required"),
  contactEmail: z.email({ error: "Invalid email address" }),
  webUrl: z.string().min(1, "Required"),
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

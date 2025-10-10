import z from "zod";
import { registrationSchema } from "./registration";

export const FundingApplicationSatus = [
  "New",
  "Processing",
  "Pre-Approved",
  "Approved",
  "Declined",
] as const;
export const FundingApplicationSatusEnum = z.enum(FundingApplicationSatus);
export type FundingApplicationSatus = z.infer<typeof FundingApplicationSatusEnum>;

export const FundingApplicationType = [
  "Personal",
  "Business",
  "Personal And Business",
  "Income",
  "All",
] as const;
export const FundingApplicationTypeEnum = z.enum(FundingApplicationType, { error: "Required" });
export type FundingApplicationType = z.infer<typeof FundingApplicationTypeEnum>;

export const getFundingApplicationType = () => {
  const data = FundingApplicationTypeEnum.options;

  return data.map((type) => ({
    value: type,
    label: type,
  }));
};

export const fundingApplicationApproveDeclineSchema = z.object({
  id: z.string().optional(),
  amountApprove: z.number({ error: "Numeric value is required" }).min(1, { error: "Required" }),
  remarks: z.string().optional(),
});

export type FundingApplicationApproveDecline = z.infer<
  typeof fundingApplicationApproveDeclineSchema
>;

export const applyFundingSchema = z.object({
  userId: z.string().min(1, { error: "Required" }),
  interestedProduct: z.string().min(1, { error: "Required" }),
  amountFunding: z.number().min(1, { error: "Required" }),
  currentSituation: z.string().optional(),
  legalResident: z.string().min(1, { error: "Required" }),
  // legalResidentOther: z.string().optional(),
  motherMaidenName: z.string().min(1, { error: "Required" }),
  isMarried: z.string().min(1, { error: "Required" }),
  addressStreet: z.string().min(1, { error: "Required" }),
  addressCity: z.string().min(1, { error: "Required" }),
  addressState: z.string().min(1, { error: "Required" }),
  addressPostal: z.string().min(1, { error: "Required" }),
  moveInCurrentAddress: z.string().min(1, { error: "Required" }),
  payPerMonth: z.number().min(1, { error: "Required" }),
  rentOrMortgage: z.string().min(1, { error: "Required" }),
  status: FundingApplicationSatusEnum,
  appliedDate: z.date(),
  referenceNumber: z.string().optional(),

  businessId: z.string().optional(),
  businessName: z.string().optional(),
  businessStreetAddress: z.string().optional(),
  businessCityAddress: z.string().optional(),
  businessStateAddress: z.string().optional(),
  businessPostalAddress: z.string().optional(),
  employerIdentificationNumber: z.string().optional(),
  businessPhoneNumber: z.string().optional(),
  businessEmail: z.email({ message: "Invalid email" }).optional(),
  businessWebsite: z.string({ error: "Required" }).optional(),
  socialMedia: z.string({ error: "Required" }).optional(),
  lastYearTaxes: z.number().optional(),
  currentYearTaxes: z.number().optional(),

  fundingType: FundingApplicationTypeEnum,
  approveOrDecline: fundingApplicationApproveDeclineSchema.optional(),

  personalIncome: z.number().optional(),
  frequencyOfIncome: z.string().optional(),
  paymentType: z.string().optional(),
  businessGross: z.number().optional(),
  businessNet: z.number().optional(),
});
export type ApplyFunding = z.infer<typeof applyFundingSchema>;

export type ApplyFundingWithUser = ApplyFunding & {
  user?: z.infer<typeof registrationSchema> | null;
};

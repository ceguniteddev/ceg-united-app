import z from "zod";

export const FundingApplicationSatus = ["New", "In-Progress", "Completed", "Declined"] as const;
export const FundingApplicationSatusEnum = z.enum(FundingApplicationSatus);

export const applyFundingSchema = z.object({
  userId: z.string().min(1, { error: "Required" }),
  interestedProduct: z.string().min(1, { error: "Required" }),
  amountFunding: z.number().min(1, { error: "Required" }),
  currentSituation: z.string().min(1, { error: "Required" }),
  legalResident: z.string().min(1, { error: "Required" }),
  legalResidentOther: z.string().optional(),
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
});
export type ApplyFunding = z.infer<typeof applyFundingSchema>;

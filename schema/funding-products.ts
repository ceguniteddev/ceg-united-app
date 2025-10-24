import z from "zod";
import { FundingApplicationTypeEnum } from "./apply-funding";
import { id } from "date-fns/locale";

export const fundingProductSchema = z.object({
  id: z.string().optional(),
  productName: z.string().min(1, { error: "Required" }),
  fundingType: FundingApplicationTypeEnum,
});
export type FundingProduct = z.infer<typeof fundingProductSchema>;

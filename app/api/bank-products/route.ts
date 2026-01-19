import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, getMessage, internalServerError } from "../helpers";
import { getBankProducts, recordBankProduct } from "@/service/bank-products";
import z from "zod";
import {
  BankFormData,
  CreditBureau,
  CreditBureauEnum,
} from "@/schema/bank-products";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const data = await getBankProducts();
    return NextResponse.json(data.data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});

const bankDataSchema = z.object({
  id: z.string().min(1, { error: "ID is required" }),
  "Bank Name": z.string().min(1, { message: "Bank Name is required" }),
  "Bureau Pulled": z.string().optional(), // csv
  "Double Dip": z.string().optional(),
  Underwriter: z.string().optional(),
  "Eligible States": z.string().optional(),
  Link: z.string().optional(),
  Location: z.string().optional(),
  "Top Banks": z.string().optional(),
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const requestBody = await request.json();
    const parsedBody = bankDataSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      const message = getMessage(parsedBody.error);

      return badRequest({ errors: message });
    }

    const bureauString = parsedBody.data["Bureau Pulled"];

    const parsedBureaus: CreditBureau[] = bureauString
      ? // 1. Split the string into an array of potential values
        bureauString
          .split(",")
          // 2. Trim whitespace from each value (e.g., " Experian" -> "Experian")
          .map((bureau) => bureau.trim())
          // 3. Use reduce to validate each value and build the final array
          .reduce((acc: CreditBureau[], bureau: string) => {
            // 4. Safely parse the string against the enum
            const validationResult = CreditBureauEnum.safeParse(bureau);

            // 5. If it's a valid enum member, add it to our accumulator array
            if (validationResult.success) {
              acc.push(validationResult.data);
            }

            return acc;
          }, [])
      : // 6. If the initial string is null or undefined, default to an empty array
        [];

    const values: BankFormData = {
      bankName: parsedBody.data["Bank Name"],
      underwritingNotes: parsedBody.data.Underwriter,
      products: [
        {
          productName: "Business credit cards",
          category: "Business", // Default category
          financingTerm: "12 Months",
          maximumFundingAmount: 0,
          averageApprovalAmount: 0,
          grossFundingPercentage: 0,
          doubleDipAllowed:
            parsedBody.data["Double Dip"] === "Yes" ? "Yes" : "No",
          minimumFicoScore: 0,
          creditBureauPulled: parsedBureaus,
          maximumInquiriesAllowed: 0,
          minimumNumberOfAccountsOnCredit: 0,
          minimumCreditAgeRequired: "2 Years",
          minimumIncomeRequired: 0,
          maximumDebtToIncomeRatio: 0,
          maximumDebtServiceRatio: 0,
          personalVerifiableIncomeRequired: "No",
          noDocumentationRequired: "No",
          businessBankStatementsRequired: "No",
          profitAndLossStatementRequired: "No",
          balanceSheetRequired: "No",
          businessPlanRequired: "No",
          membershipRequiredBeforeApplicationRequired: "No",
          membershipRequiredUponApprovalRequired: "No",
          accountOpeningBeforeApplicationRequired: "No",
          accountOpeningAfterApprovalRequired: "No",
          businessTaxesRequired: "None",
          personalTaxesRequired: "None",
          immigrationStatusRequirement: "",
          stateAvailability:
            parsedBody.data["Eligible States"]?.split(",") || [],
          applicationMethod: [],
          allowsForwardingViaEmail: "Yes",
          canBeFinalizedOnline: "Yes",
          clientNeedsToGoToBranch: "No",
        },
      ],
    };

    await recordBankProduct(values);

    const data = await getBankProducts();
    return NextResponse.json(data.data, { status: 201 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});

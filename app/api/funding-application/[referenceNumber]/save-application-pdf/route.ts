import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";
import { saveApplicationToPDF } from "@/service/funding-application-pdf";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: NextRequest,
    context: { params: Promise<{ referenceNumber: string }> },
  ) => {
    try {
      const { referenceNumber } = await context.params;

      if (!referenceNumber) {
        return badRequest({ errors: "Reference number is required" });
      }

      // Get the funding application to retrieve userId
      const fundingApplication = await getApplyFundingByReferenceNumber({
        referenceNumber,
      });

      if (!fundingApplication) {
        return badRequest({ errors: "Funding application not found" });
      }

      const userId = fundingApplication.userId;

      if (!userId) {
        return badRequest({
          errors: "User ID not found for the funding application",
        });
      }

      // Generate the PDF directly using @react-pdf/renderer and save
      const result = await saveApplicationToPDF(referenceNumber, userId);

      return NextResponse.json(
        {
          message: "Application PDF saved successfully",
          data: result,
        },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Error generating/saving application PDF:", error);
      return internalServerError(
        error.message || "Failed to generate application PDF",
      );
    }
  },
);

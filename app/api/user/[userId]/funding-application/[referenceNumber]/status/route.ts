import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { updateApplicationStatus } from "@/service/apply-funding";
import { saveFeeAgreementToPDF } from "@/service/fee-agreement-pdf";

export const PUT = withAuth(
  async (
    request: NextRequest,
    {
      params,
    }: { params?: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const referenceNumber = resolvedParams?.referenceNumber;
      const userId = resolvedParams?.userId;

      if (!referenceNumber || !userId) {
        return badRequest({
          errors: "Reference Number and User ID are required",
        });
      }

      const body = await request.json();
      const { status, signature, fundingAmount, feeAmount } = body;

      if (!status) {
        return badRequest({ errors: "Status is required" });
      }

      await updateApplicationStatus(referenceNumber, status, undefined);

      if (signature && fundingAmount !== undefined && feeAmount !== undefined) {
        try {
          await saveFeeAgreementToPDF(
            referenceNumber,
            userId,
            signature,
            fundingAmount,
            feeAmount,
          );
        } catch (pdfError) {
          console.error("Error saving fee agreement PDF:", pdfError);
          // Continuing without throwing so the status update succeeds
        }
      }

      return NextResponse.json(
        { message: "Status updated successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error updating status:", error);
      return internalServerError();
    }
  },
);

import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { calculateBusinessIncomePreApproved } from "@/service/n8n";

export const POST = withAuth(
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

      await calculateBusinessIncomePreApproved({
        userId,
        referenceNumber,
      });

      return NextResponse.json(
        { message: "Calculation triggered successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error triggering income calculation:", error);
      return internalServerError();
    }
  },
);

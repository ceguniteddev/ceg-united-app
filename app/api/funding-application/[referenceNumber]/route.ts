import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest("Missing reference number");
    }

    try {
      const data = await getApplyFundingByReferenceNumber({ referenceNumber });
      return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  }
);

import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import {
  getApplyFundingByReferenceNumber,
  updateApplyFunding,
} from "@/service/apply-funding";
import { z } from "zod";

const analysisStatusSchema = z.object({
  status: z.enum(["In Progress", "Completed"]),
});

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> },
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    try {
      const body = await request.json();
      const validation = analysisStatusSchema.safeParse(body);

      if (!validation.success) {
        return badRequest({ errors: validation.error.issues });
      }

      const fundingApplication = await getApplyFundingByReferenceNumber({
        referenceNumber,
      });

      if (!fundingApplication) {
        return badRequest({ errors: "Funding application not found" });
      }

      await updateApplyFunding({
        value: {
          ...fundingApplication,
          analysisStatus: validation.data.status,
          referenceNumber,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  },
);

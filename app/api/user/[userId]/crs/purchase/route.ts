import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { generateCRSReport, generateCRSReportBusiness } from "@/service/crs";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing user ID" });
      }

      const body = await req.json();
      const { metadata } = body;

      if (!metadata || !metadata.reportType || !metadata.referenceNumber) {
        return badRequest({ errors: "Invalid metadata payload" });
      }

      const { reportType, businessId } = metadata;

      // Note: You can store the purchase record in a Firestore collection here
      // if tracking CRS purchases is needed. Currently, Whop SDK + Firestore
      // automatically syncs payments to USER_WHOP_PAYMENTS collection via webhooks.

      if (reportType === "personal") {
        await generateCRSReport({
          userId,
          bureaus: { equifax: true, experian: true, transunion: true },
          bypassPremiumCheck: true,
        });
      } else if (reportType === "business" && businessId) {
        await generateCRSReportBusiness({
          userId,
          businessId,
          bypassPremiumCheck: true,
        });
      } else {
        return badRequest({
          errors: "Invalid report type or missing business ID",
        });
      }

      return NextResponse.json({
        success: true,
        message: "CRS report generation triggered successfully",
      });
    } catch (error: any) {
      console.error("Error triggering CRS generation after purchase:", error);
      return internalServerError(
        error.message || "Failed to trigger report generation",
      );
    }
  },
);

import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { analyzeCreditReports } from "@/service/dispute-letter/analysis";

/**
 * POST /api/user/[userId]/dispute-letter/analyze
 * Analyze user's credit reports for dispute opportunities
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    context: { params?: Promise<{ userId: string }>; currentUser: any }
  ) => {
    const { currentUser } = context;
    const { userId } = (await context.params) ?? {};

    if (!currentUser) {
      return badRequest({ errors: "User not authenticated" });
    }

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    // Check authorization - user can only analyze their own reports unless admin
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const analysis = await analyzeCreditReports(userId);
      return NextResponse.json(analysis, { status: 200 });
    } catch (error: any) {
      console.error("Failed to analyze credit reports:", error);
      return internalServerError(
        error.message || "Failed to analyze credit reports"
      );
    }
  }
);

import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { analyzeCreditReports } from "@/service/dispute-letter/analysis";

/**
 * POST /api/dispute-letter/analyze
 * Analyze user's credit reports for dispute opportunities
 */
export const POST = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  try {
    const analysis = await analyzeCreditReports(currentUser.uid);
    return NextResponse.json(analysis, { status: 200 });
  } catch (error: any) {
    console.error("Failed to analyze credit reports:", error);
    return internalServerError(
      error.message || "Failed to analyze credit reports"
    );
  }
});

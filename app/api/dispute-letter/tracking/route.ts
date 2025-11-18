import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getDisputeTracking } from "@/service/dispute-letter/letter";

/**
 * GET /api/dispute-letter/tracking
 * Get dispute tracking records for current user
 */
export const GET = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  try {
    const tracking = await getDisputeTracking(currentUser.uid);
    return NextResponse.json(tracking, { status: 200 });
  } catch (error: any) {
    console.error("Failed to get dispute tracking:", error);
    return internalServerError();
  }
});

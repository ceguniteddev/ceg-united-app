import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { getDisputeTracking } from "@/service/dispute-letter/letter";

/**
 * GET /api/user/[userId]/dispute-letter/tracking
 * Get dispute tracking records for specified user
 */
export const GET = withAuth(
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

    // Check authorization - user can only access their own tracking unless admin
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const tracking = await getDisputeTracking(userId);
      return NextResponse.json(tracking, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get dispute tracking:", error);
      return internalServerError();
    }
  }
);

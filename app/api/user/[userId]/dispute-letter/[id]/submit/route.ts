import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import {
  getDisputeLetter,
  submitLetterForReview,
} from "@/service/dispute-letter/letter";

/**
 * POST /api/user/[userId]/dispute-letter/[id]/submit
 * Submit a letter for admin review
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    context: {
      params?: Promise<{ userId: string; id: string }>;
      currentUser: any;
    }
  ) => {
    const { currentUser } = context;
    const { userId, id } = (await context.params) ?? {};

    if (!userId || !id) {
      return badRequest({ errors: "User ID and Letter ID are required" });
    }

    // Check authorization - user can only submit their own letters
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const letter = await getDisputeLetter(id);

      if (!letter) {
        return badRequest({ errors: "Letter not found" });
      }

      // Verify letter belongs to specified user
      if (letter.userId !== userId) {
        return badRequest({ errors: "Letter not found" });
      }

      const updatedLetter = await submitLetterForReview(id);
      return NextResponse.json(updatedLetter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to submit letter for review:", error);
      return internalServerError();
    }
  }
);

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
 * POST /api/dispute-letter/[id]/submit
 * Submit a letter for admin review
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> }
  ) => {
    const currentUser = (request as any).currentUser;
    const { id } = (await params) ?? {};

    try {
      const letter = await getDisputeLetter(id as string);

      if (!letter) {
        return badRequest({ errors: "Letter not found" });
      }

      // Check authorization
      if (letter.userId !== currentUser.uid) {
        return unauthorized();
      }

      const updatedLetter = await submitLetterForReview(id as string);
      return NextResponse.json(updatedLetter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to submit letter for review:", error);
      return internalServerError();
    }
  }
);

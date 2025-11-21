import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import {
  getDisputeLetter,
  sendDisputeLetter,
} from "@/service/dispute-letter/letter";

/**
 * POST /api/user/[userId]/dispute-letter/[id]/send
 * Send an approved letter via Letterstream (admin only)
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

    if (!currentUser.admin) {
      return unauthorized();
    }

    if (!userId || !id) {
      return badRequest({ errors: "User ID and Letter ID are required" });
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

      const updatedLetter = await sendDisputeLetter(id);
      return NextResponse.json(updatedLetter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to send letter:", error);
      return internalServerError();
    }
  }
);

import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getMessage,
  internalServerError,
  notFound,
  unauthorized,
} from "@/app/api/helpers";
import {
  createDisputeLetter,
  getDisputeLetters,
  getLettersPendingReview,
} from "@/service/dispute-letter/letter";
import { DisputeLetterSchema } from "@/schema/dispute-letter";
import { getUserById } from "@/service/user";

/**
 * GET /api/user/[userId]/dispute-letter
 * Get all dispute letters for the specified user (or all if admin)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    try {
      // Check if user has access to letter feature
      const userData = await getUserById(userId);

      if (!userData) {
        return unauthorized();
      }

      const letters = await getDisputeLetters(userId);
      return NextResponse.json(letters, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get dispute letters:", error);
      return internalServerError();
    }
  }
);

/**
 * POST /api/user/[userId]/dispute-letter
 * Create a new dispute letter
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    try {
      // Check if user has access to letter feature
      const userData = await getUserById(userId);

      if (!userData) {
        return notFound();
      }

      const body = await request.json();
      const validation = DisputeLetterSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
      }).safeParse({
        ...body,
        userId: userId,
      });

      if (!validation.success) {
        const message = getMessage(validation.error);
        return badRequest({ errors: message });
      }

      const letter = await createDisputeLetter(validation.data);
      return NextResponse.json(letter, { status: 201 });
    } catch (error: any) {
      console.error("Failed to create dispute letter:", error);
      return internalServerError();
    }
  }
);

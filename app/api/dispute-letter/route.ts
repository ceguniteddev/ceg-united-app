import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getMessage,
  internalServerError,
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
 * GET /api/dispute-letter
 * Get all dispute letters for the current user (or all if admin)
 */
export const GET = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  try {
    // Check if user has access to letter feature
    const userData = await getUserById(currentUser.uid);

    if (!userData) {
      return unauthorized();
    }

    // Admin can get all letters pending review
    if (currentUser.admin) {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");

      if (status === "pending-review") {
        const letters = await getLettersPendingReview();
        return NextResponse.json(letters, { status: 200 });
      }
    }

    // Check if user has letter feature enabled
    if (!currentUser.admin && !userData.letterFeatureEnabled) {
      return unauthorized();
    }

    const letters = await getDisputeLetters(currentUser.uid);
    return NextResponse.json(letters, { status: 200 });
  } catch (error: any) {
    console.error("Failed to get dispute letters:", error);
    return internalServerError();
  }
});

/**
 * POST /api/dispute-letter
 * Create a new dispute letter
 */
export const POST = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  try {
    // Check if user has access to letter feature
    const userData = await getUserById(currentUser.uid);

    if (!userData) {
      return unauthorized();
    }

    if (!currentUser.admin && !userData.letterFeatureEnabled) {
      return unauthorized();
    }

    const body = await request.json();
    const validation = DisputeLetterSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      sentAt: true,
    }).safeParse({
      ...body,
      userId: currentUser.uid,
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
});

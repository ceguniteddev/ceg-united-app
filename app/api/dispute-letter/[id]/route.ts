import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getMessage,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import {
  getDisputeLetter,
  updateDisputeLetter,
  deleteDisputeLetter,
  submitLetterForReview,
  approveDisputeLetter,
  sendDisputeLetter,
} from "@/service/dispute-letter/letter";
import { DisputeLetterSchema } from "@/schema/dispute-letter";

/**
 * GET /api/dispute-letter/[id]
 * Get a specific dispute letter
 */
export const GET = withAuth(
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
      if (!currentUser.admin && letter.userId !== currentUser.uid) {
        return unauthorized();
      }

      return NextResponse.json(letter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get dispute letter:", error);
      return internalServerError();
    }
  }
);

/**
 * PUT /api/dispute-letter/[id]
 * Update a dispute letter
 */
export const PUT = withAuth(
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
      if (!currentUser.admin && letter.userId !== currentUser.uid) {
        return unauthorized();
      }

      const body = await request.json();
      const validation = DisputeLetterSchema.partial().safeParse(body);

      if (!validation.success) {
        const message = getMessage(validation.error);
        return badRequest({ errors: message });
      }

      const updatedLetter = await updateDisputeLetter(
        id as string,
        validation.data
      );
      return NextResponse.json(updatedLetter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to update dispute letter:", error);
      return internalServerError();
    }
  }
);

/**
 * DELETE /api/dispute-letter/[id]
 * Delete a dispute letter
 */
export const DELETE = withAuth(
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
      if (!currentUser.admin && letter.userId !== currentUser.uid) {
        return unauthorized();
      }

      await deleteDisputeLetter(id as string);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error("Failed to delete dispute letter:", error);
      return internalServerError();
    }
  }
);

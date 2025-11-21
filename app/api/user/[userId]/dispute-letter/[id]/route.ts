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
} from "@/service/dispute-letter/letter";
import { DisputeLetterSchema } from "@/schema/dispute-letter";

/**
 * GET /api/user/[userId]/dispute-letter/[id]
 * Get a specific dispute letter
 */
export const GET = withAuth(
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

    // Check authorization - user can only access their own letters unless admin
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const letter = await getDisputeLetter(id);

      if (!letter) {
        return badRequest({ errors: "Letter not found" });
      }

      // Double-check letter belongs to requested user
      if (letter.userId !== userId) {
        return badRequest({ errors: "Letter not found" });
      }

      return NextResponse.json(letter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get dispute letter:", error);
      return internalServerError();
    }
  }
);

/**
 * PUT /api/user/[userId]/dispute-letter/[id]
 * Update a dispute letter
 */
export const PUT = withAuth(
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

    // Check authorization - user can only update their own letters unless admin
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const letter = await getDisputeLetter(id);

      if (!letter) {
        return badRequest({ errors: "Letter not found" });
      }

      // Double-check letter belongs to requested user
      if (letter.userId !== userId) {
        return badRequest({ errors: "Letter not found" });
      }

      const body = await request.json();
      const validation = DisputeLetterSchema.partial().safeParse(body);

      if (!validation.success) {
        const message = getMessage(validation.error);
        return badRequest({ errors: message });
      }

      const updatedLetter = await updateDisputeLetter(id, validation.data);
      return NextResponse.json(updatedLetter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to update dispute letter:", error);
      return internalServerError();
    }
  }
);

/**
 * DELETE /api/user/[userId]/dispute-letter/[id]
 * Delete a dispute letter
 */
export const DELETE = withAuth(
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

    // Check authorization - user can only delete their own letters unless admin
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const letter = await getDisputeLetter(id);

      if (!letter) {
        return badRequest({ errors: "Letter not found" });
      }

      // Double-check letter belongs to requested user
      if (letter.userId !== userId) {
        return badRequest({ errors: "Letter not found" });
      }

      await deleteDisputeLetter(id);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error("Failed to delete dispute letter:", error);
      return internalServerError();
    }
  }
);

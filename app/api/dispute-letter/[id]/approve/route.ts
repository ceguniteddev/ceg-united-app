import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import {
  getDisputeLetter,
  approveDisputeLetter,
} from "@/service/dispute-letter/letter";

/**
 * POST /api/dispute-letter/[id]/approve
 * Approve a letter (admin only)
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> }
  ) => {
    const currentUser = (request as any).currentUser;
    const { id } = (await params) ?? {};

    if (!currentUser.admin) {
      return unauthorized();
    }

    try {
      const letter = await getDisputeLetter(id as string);

      if (!letter) {
        return badRequest({ errors: "Letter not found" });
      }

      const updatedLetter = await approveDisputeLetter(
        id as string,
        currentUser.uid
      );
      return NextResponse.json(updatedLetter, { status: 200 });
    } catch (error: any) {
      console.error("Failed to approve letter:", error);
      return internalServerError();
    }
  }
);

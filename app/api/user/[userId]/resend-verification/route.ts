import {
  badRequest,
  forbidden,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getCurrentUser, resendVerificationEmail } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";
import AppError from "@/error/AppError";

/**
 * POST /api/user/[userId]/resend-verification
 * Resends the verification email for a specific user
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    context: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await context.params) ?? {};
      if (!userId) {
        return badRequest({ errors: "User ID is required" });
      }

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return unauthorized();
      }

      // Verify the requesting user is either Admin or themselves
      if (currentUser.role !== "Admin" && currentUser.uid !== userId) {
        return forbidden(
          "Access denied: You do not have permission to resend verification email for this user",
        );
      }

      const result = await resendVerificationEmail(userId);

      return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
      console.error(
        "POST /api/user/[userId]/resend-verification error:",
        error,
      );
      if (error instanceof AppError) {
        return badRequest({ errors: error.message });
      }
      return internalServerError(
        error.message || "An unexpected error occurred",
      );
    }
  },
);

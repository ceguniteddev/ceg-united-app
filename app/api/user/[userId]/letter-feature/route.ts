import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getMessage,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { toggleLetterFeature } from "@/service/user";
import { z } from "zod";

const toggleSchema = z.object({
  enabled: z.boolean(),
  featureKey: z
    .enum([
      "letterFeatureEnabled",
      "latePaymentRemovalEnabled",
      "unauthorizedInquiryRemovalEnabled",
      "verifiedAccountDisputeEnabled",
      "noResponseFollowUpEnabled",
      "reinsertedAccountDisputeEnabled",
      "accountErrorCorrectionEnabled",
      "collectionAccountRemovalEnabled",
      "fraudulentAccountRemovalEnabled",
    ])
    .optional()
    .default("letterFeatureEnabled"),
});

/**
 * PUT /api/user/[userId]/letter-feature
 * Toggle letter feature for a user (admin only)
 */
export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};

    try {
      const body = await request.json();
      const validation = toggleSchema.safeParse(body);

      if (!validation.success) {
        const message = getMessage(validation.error);
        return badRequest({ errors: message });
      }

      await toggleLetterFeature(
        userId as string,
        validation.data.enabled,
        validation.data.featureKey
      );

      return NextResponse.json(
        {
          success: true,
          message: `Letter feature ${
            validation.data.enabled ? "enabled" : "disabled"
          } successfully`,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Failed to toggle letter feature:", error);
      return internalServerError(
        error.message || "Failed to toggle letter feature"
      );
    }
  }
);

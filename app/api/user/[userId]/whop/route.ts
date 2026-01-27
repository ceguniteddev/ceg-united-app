import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { createWhopCheckoutConfig } from "@/service/whop";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    const { referenceNumber } = await request.json();

    if (!userId) {
      return badRequest({
        errors: "User ID is required.",
        message: "User ID is required.",
      });
    }

    if (!referenceNumber) {
      return badRequest({
        errors: "Reference number is required.",
        message: "Reference number is required.",
      });
    }

    try {
      const checkoutId = await createWhopCheckoutConfig({
        userId,
        referenceNumber,
      });

      return NextResponse.json({ checkoutId });
    } catch (error) {
      return internalServerError(
        "An error occurred while creating the checkout link.",
      );
    }
  },
);

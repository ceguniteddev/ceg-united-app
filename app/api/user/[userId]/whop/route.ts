import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { createWhopCheckoutLink } from "@/service/whop";
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
        errors: "Reference Number is required.",
        message: "Reference Number is required.",
      });
    }

    try {
      const checkoutUrl = await createWhopCheckoutLink({
        userId,
        referenceNumber,
      });

      return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
      return internalServerError(
        "An error occurred while creating the checkout link.",
      );
    }
  },
);

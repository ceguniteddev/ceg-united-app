import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { createWhopCheckoutLink } from "@/service/whop";
import { badRequest, internalServerError } from "@/app/api/helpers";

const PRODUCT_ID = "pass_2Jv9h283j29D2"; // Business Consulting Fee Access Pass ID

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};

    if (!userId) {
      return badRequest({
        message: "Missing userId parameter",
        errors: "Missing userId parameter",
      });
    }

    try {
      const checkoutUrl = await createWhopCheckoutLink({
        userId,
      });

      return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
      return internalServerError(
        "An error occurred while creating the checkout link.",
      );
    }
  },
);

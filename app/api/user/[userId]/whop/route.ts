import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { createWhopCheckoutConfig } from "@/service/whop";
import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import z from "zod";
import { PaymentPlanEnum } from "@/schema/payments";

const requestBodySchema = z.object({
  referenceNumber: z.string().min(1, { error: "Required" }),
  paymentKey: PaymentPlanEnum,
});

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    const requestBody = await request.json();

    if (!userId) {
      return badRequest({
        errors: "User ID is required.",
        message: "User ID is required.",
      });
    }

    const parseResult = requestBodySchema.safeParse(requestBody);

    if (!parseResult.success) {
      const message = getMessage(parseResult.error);

      return badRequest({ errors: message });
    }

    try {
      const checkoutId = await createWhopCheckoutConfig({
        userId,
        referenceNumber: parseResult.data.referenceNumber,
        paymentKey: parseResult.data.paymentKey,
      });

      return NextResponse.json({ checkoutId });
    } catch (error) {
      return internalServerError(
        "An error occurred while creating the checkout link.",
      );
    }
  },
);

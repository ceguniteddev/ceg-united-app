import { NextRequest, NextResponse } from "next/server";
import z from "zod";

import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { PaymentPlanEnum } from "@/schema/payments";
import { createDodoCheckoutConfig } from "@/service/dodo";

const requestSchema = z.object({
  paymentKey: PaymentPlanEnum,
  customAmount: z.number().positive().optional(),
});

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) || {};
    if (!userId) return badRequest({ errors: "User ID is required." });
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success)
      return badRequest({ errors: getMessage(parsed.error) });
    try {
      return NextResponse.json(
        await createDodoCheckoutConfig({ userId, ...parsed.data }),
      );
    } catch {
      return internalServerError(
        "An error occurred while creating the Dodo checkout.",
      );
    }
  },
);

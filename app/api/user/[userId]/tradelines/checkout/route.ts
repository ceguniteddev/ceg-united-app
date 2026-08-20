import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { createDodoCheckoutConfig } from "@/service/dodo";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing user ID" });
      }
      const body = await req.json();
      const { items, totalPrice } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return badRequest({ errors: "Cart items are required" });
      }

      if (!totalPrice || typeof totalPrice !== "number") {
        return badRequest({ errors: "Total price is required" });
      }

      // Dodo BYOP amounts use the smallest currency unit (cents).
      const { checkoutId, url } = await createDodoCheckoutConfig({
        userId: userId,
        paymentKey: "TradelinePurchase",
        customAmount: Math.round(totalPrice * 100),
      });

      return NextResponse.json({
        checkoutId,
        url,
        items,
        totalPrice,
      });
    } catch (error: any) {
      console.error("Error creating tradeline checkout:", error);
      return internalServerError(
        error.message || "Failed to create checkout session",
      );
    }
  },
);

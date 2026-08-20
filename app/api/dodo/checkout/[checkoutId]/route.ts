import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getDodoCheckoutDetailByCheckoutId } from "@/service/dodo";

export const GET = withAuth(
  async (
    _request: NextRequest,
    { params }: { params?: Promise<{ checkoutId: string }> },
  ) => {
    const { checkoutId } = (await params) || {};
    if (!checkoutId) {
      return NextResponse.json(
        { error: "Checkout ID is required" },
        { status: 400 },
      );
    }
    const checkout = await getDodoCheckoutDetailByCheckoutId(checkoutId);
    return checkout
      ? NextResponse.json(checkout)
      : NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  },
);

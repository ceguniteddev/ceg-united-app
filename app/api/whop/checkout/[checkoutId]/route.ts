import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getWhopCheckoutDetailByCheckoutId } from "@/service/whop";

export const GET = withAuth(
  async (
    req: Request,
    { params }: { params?: Promise<{ checkoutId: string }> },
  ) => {
    try {
      const { checkoutId } = (await params) ?? {};
      if (!checkoutId) {
        return NextResponse.json(
          { message: "Checkout ID is required" },
          { status: 400 },
        );
      }

      const checkoutDetails =
        await getWhopCheckoutDetailByCheckoutId(checkoutId);

      if (!checkoutDetails) {
        return NextResponse.json(
          { message: "Checkout details not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(checkoutDetails);
    } catch (error: any) {
      return NextResponse.json(
        { message: `Error fetching checkout details: ${error.message}` },
        { status: 500 },
      );
    }
  },
);

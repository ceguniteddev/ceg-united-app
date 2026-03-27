import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getUserCart, updateUserCart, clearUserCart } from "@/service/cart";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing user ID" });
    }

    try {
      const items = await getUserCart(userId);
      return NextResponse.json({ items });
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      return internalServerError(error.message);
    }
  },
);

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing user ID" });
    }

    try {
      const body = await request.json();
      const { items } = body;

      if (!Array.isArray(items)) {
        return badRequest({ errors: "Invalid cart items format." });
      }

      await updateUserCart(userId, items);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error updating cart:", error);
      return internalServerError(error.message);
    }
  },
);

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing user ID" });
    }

    try {
      await clearUserCart(userId);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      return internalServerError(error.message);
    }
  },
);

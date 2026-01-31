import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { internalServerError } from "@/app/api/helpers";
import { deleteBankProduct, getBankProduct } from "@/service/bank-products";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> },
  ) => {
    try {
      const { id } = (await params) ?? {};
      if (!id) {
        return NextResponse.json("Bank product id is required", {
          status: 400,
        });
      }

      const data = await getBankProduct(id);
      return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  },
);

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> },
  ) => {
    try {
      const { id } = (await params) ?? {};
      if (!id) {
        return NextResponse.json("Bank product id is required", {
          status: 400,
        });
      }

      await deleteBankProduct(id);
      return NextResponse.json(
        { message: "Bank product deleted successfully" },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  },
);

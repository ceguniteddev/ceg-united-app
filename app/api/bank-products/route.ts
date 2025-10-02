import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { internalServerError } from "../helpers";
import { getBankProducts } from "@/service/bank-products";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const data = await getBankProducts();
    return NextResponse.json(data.data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});

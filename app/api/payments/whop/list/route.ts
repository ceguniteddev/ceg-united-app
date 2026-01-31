import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getWhopPayments } from "@/service/whop";
import { internalServerError } from "@/app/api/helpers";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const payments = await getWhopPayments();
    return NextResponse.json(payments);
  } catch (error) {
    return internalServerError(
      "An error occurred while fetching Whop payments.",
    );
  }
});

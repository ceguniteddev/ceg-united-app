import { internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getDenefitsPayments } from "@/service/denefits";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const payments = await getDenefitsPayments();
    return NextResponse.json(payments, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});

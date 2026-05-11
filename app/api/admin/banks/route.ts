import { NextRequest, NextResponse } from "next/server";
import { internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getBanks } from "@/service/bank-management";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const isBrokerageParam = searchParams.get("isBrokerage");

    let banks = await getBanks();

    if (isBrokerageParam !== null) {
      const isBrokerageFilter = isBrokerageParam.toLowerCase() === "true";
      banks = banks.filter((bank) => !!bank.isBrokerage === isBrokerageFilter);
    }

    return NextResponse.json(banks, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching banks:", error);
    return internalServerError();
  }
});

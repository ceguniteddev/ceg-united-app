import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getWhopPayments } from "@/service/whop";

export const GET = withAuth(async (req: Request) => {
  try {
    const payments = await getWhopPayments();
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json(
      { message: `Error fetching whop payments: ${error.message}` },
      { status: 500 },
    );
  }
});

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getBrokerCommissions } from "@/service/broker";

/**
 * GET /api/broker/commissions?status=Pending
 * Get broker commissions with optional status filter
 */
export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ brokerId: string }> }
  ) => {
    try {
      const brokerId = (await params)?.brokerId;
      if (!brokerId) {
        return badRequest({ errors: "Broker ID is required" });
      }
      const { searchParams } = new URL(req.url);
      const statusParam = searchParams.get("status");
      const status = statusParam as "Pending" | "Approved" | "Paid" | undefined;

      const commissions = await getBrokerCommissions(brokerId, status);

      return NextResponse.json(commissions, { status: 200 });
    } catch (error) {
      console.error("Error fetching broker commissions:", error);
      return internalServerError("Failed to fetch broker commissions");
    }
  }
);

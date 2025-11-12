import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, internalServerError, notFound } from "@/app/api/helpers";
import { getBrokerStatistics } from "@/service/broker";

/**
 * GET /api/broker/statistics
 * Get broker dashboard statistics
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

      const statistics = await getBrokerStatistics(brokerId);

      if (!statistics) {
        return notFound("Broker statistics not found");
      }

      return NextResponse.json(statistics, { status: 200 });
    } catch (error) {
      console.error("Error fetching broker statistics:", error);
      return internalServerError("Failed to fetch broker statistics");
    }
  }
);

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getAllBrokers } from "@/service/broker";
import { internalServerError } from "@/app/api/helpers";

/**
 * GET /api/broker
 * Get all brokers (admin only)
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const brokers = await getAllBrokers();
    return NextResponse.json(brokers, { status: 200 });
  } catch (error) {
    console.error("Error fetching brokers:", error);
    return internalServerError("Failed to fetch brokers");
  }
});

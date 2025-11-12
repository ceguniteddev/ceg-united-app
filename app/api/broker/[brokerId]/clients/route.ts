import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getBrokerClients } from "@/service/broker";

/**
 * GET /api/broker/clients
 * Get all clients linked to broker
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

      const clients = await getBrokerClients(brokerId);

      return NextResponse.json(clients, { status: 200 });
    } catch (error) {
      console.error("Error fetching broker clients:", error);
      return internalServerError("Failed to fetch broker clients");
    }
  }
);

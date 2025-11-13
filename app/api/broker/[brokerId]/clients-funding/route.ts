import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getBrokerClientsMappedFunding } from "@/service/broker";

/**
 * GET /api/broker/[brokerId]/clients-funding
 * Get all mapped funding products for broker's clients
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

      const mappedFunding = await getBrokerClientsMappedFunding(brokerId);

      return NextResponse.json(mappedFunding, { status: 200 });
    } catch (error) {
      console.error("Error fetching broker clients' funding products:", error);
      return internalServerError(
        "Failed to fetch broker clients' funding products"
      );
    }
  }
);

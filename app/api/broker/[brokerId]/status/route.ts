import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { updateBrokerStatus } from "@/service/broker";
import { badRequest, internalServerError } from "@/app/api/helpers";

/**
 * PUT /api/broker/[brokerId]/status
 * Update broker status (admin only)
 */
export const PUT = withAuth(
  async (
    req: NextRequest,
    context: { user: { role: string }; params?: Promise<{ brokerId: string }> }
  ) => {
    try {
      const brokerId = (await context.params)?.brokerId;
      if (!brokerId) {
        return badRequest({ errors: "Broker ID is required" });
      }

      const body = await req.json();
      const { status } = body;

      if (!status) {
        return badRequest({ errors: "Status is required" });
      }

      if (!["Active", "InActive", "Paused"].includes(status)) {
        return badRequest({
          errors: "Invalid status. Must be Active, InActive, or Paused",
        });
      }

      await updateBrokerStatus({ id: brokerId, status });

      return NextResponse.json(
        { message: "Broker status updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error updating broker status:", error);
      return internalServerError(
        error instanceof Error
          ? error.message
          : "Failed to update broker status"
      );
    }
  }
);

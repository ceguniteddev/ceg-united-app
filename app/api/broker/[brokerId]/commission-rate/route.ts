import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import { badRequest, internalServerError } from "@/app/api/helpers";

/**
 * PUT /api/broker/[brokerId]/commission-rate
 * Update broker commission rate (admin only)
 */
export const PUT = withAuth(
  async (
    req: NextRequest,
    context: { params: Promise<{ brokerId: string }>; user: { role: string } }
  ) => {
    try {
      const { brokerId } = await context.params;
      if (!brokerId) {
        return badRequest({ errors: "Broker ID is required" });
      }

      const body = await req.json();
      const { commissionRate } = body;

      if (
        typeof commissionRate !== "number" ||
        commissionRate < 0 ||
        commissionRate > 100
      ) {
        return badRequest({
          errors: "Commission rate must be a number between 0 and 100",
        });
      }

      const db = firestoreAdmin();
      const brokerRef = db.collection(USER_COLLECTION).doc(brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        return badRequest({ errors: "Broker not found" });
      }

      const brokerData = brokerDoc.data();
      if (brokerData?.role !== "Broker") {
        return badRequest({ errors: "User is not a broker" });
      }

      await brokerRef.update({ commissionRate });

      return NextResponse.json(
        { message: "Commission rate updated successfully", commissionRate },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error updating commission rate:", error);
      return internalServerError("Failed to update commission rate");
    }
  }
);

import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import { BROKER_CLIENT_MAPPING } from "@/constant/collection-name";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      const { brokerId, brokerName } = await request.json();

      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      logInfo("Updating client broker mapping", {
        userId,
        brokerId,
        brokerName,
      });

      const db = firestoreAdmin();

      // First, deactivate any existing active mappings for this client
      const existingMappings = await db
        .collection(BROKER_CLIENT_MAPPING)
        .where("clientId", "==", userId)
        .where("status", "==", "Active")
        .get();

      const batch = db.batch();

      // Deactivate all existing mappings
      existingMappings.docs.forEach((doc) => {
        batch.update(doc.ref, { status: "Inactive", updatedAt: new Date() });
      });

      // If brokerId is provided, create new mapping
      if (brokerId) {
        const newMappingRef = db.collection(BROKER_CLIENT_MAPPING).doc();
        batch.set(newMappingRef, {
          clientId: userId,
          brokerId,
          brokerName,
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        logInfo("Creating new broker-client mapping", { userId, brokerId });
      } else {
        logInfo("Removing broker assignment from client", { userId });
      }

      await batch.commit();
      logInfo("Broker mapping updated successfully", { userId, brokerId });

      return NextResponse.json(
        { message: "Broker assignment updated successfully" },
        { status: 200 },
      );
    } catch (error: any) {
      logError(new Error("Error updating broker assignment"), error);
      return internalServerError(
        error.message || "Failed to update broker assignment",
      );
    }
  },
);

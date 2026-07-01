import { NextRequest, NextResponse } from "next/server";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getCurrentUser } from "@/service/user";
import { PSF_INVOICES_COLLECTION } from "@/constant/collection-name";

/**
 * POST /api/user/[userId]/psf-invoices/[invoiceId]/manual-pay
 * Admin-only: Manually marks a PSF success fee invoice as paid.
 * Also handles updating corresponding funding application status if linked.
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string; invoiceId: string }> },
  ) => {
    try {
      const resolvedParams = params ? await params : undefined;
      const userId = resolvedParams?.userId;
      const invoiceId = resolvedParams?.invoiceId;

      // Admin-only check
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return unauthorized();
      }
      if (currentUser.role !== "Admin") {
        return unauthorized("Only admins can manually mark invoices as paid.");
      }

      if (!userId || !invoiceId) {
        return badRequest({
          errors: "User ID and Invoice ID are required.",
        });
      }

      const db = firestoreAdmin();
      const invoiceRef = db.collection(PSF_INVOICES_COLLECTION).doc(invoiceId);
      const invoiceDoc = await invoiceRef.get();

      if (!invoiceDoc.exists) {
        return badRequest({ errors: "PSF invoice not found." });
      }

      const invoiceData = invoiceDoc.data();
      if (!invoiceData) {
        return badRequest({ errors: "PSF invoice is empty." });
      }

      if (invoiceData.userId !== userId) {
        return badRequest({
          errors: "Invoice does not belong to this user.",
        });
      }

      // Check if it's already paid
      if (invoiceData.status === "paid") {
        return badRequest({ errors: "Invoice is already paid." });
      }

      const now = new Date().toISOString();

      // Update the invoice document to paid
      await invoiceRef.update({
        status: "paid",
        paidAt: now,
        updatedAt: now,
        manuallyPaidBy: currentUser.uid,
      });

      // Update corresponding fund-mapping-approved status if linked
      if (invoiceData.fundMappingApprovedId && invoiceData.referenceNumber) {
        try {
          await db
            .collection(
              `user-funding-application/${invoiceData.referenceNumber}/fund-mapping-approved`,
            )
            .doc(invoiceData.fundMappingApprovedId)
            .set(
              {
                clientApplicationStatus: "Funded",
                updatedAt: now,
              },
              { merge: true },
            );
        } catch (linkError: any) {
          console.error(
            "Error updating fund-mapping-approved status:",
            linkError,
          );
          // Non-fatal, let the invoice manual payment succeed
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: "Invoice successfully marked as paid.",
        },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Failed to manually mark PSF invoice as paid:", error);
      return internalServerError(
        "An error occurred while manually updating invoice status.",
      );
    }
  },
);

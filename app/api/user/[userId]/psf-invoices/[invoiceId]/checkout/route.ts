import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { PSF_INVOICES_COLLECTION } from "@/constant/collection-name";
import { withAuth } from "@/lib/api-validation";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { createPsfInvoiceCheckoutConfig } from "@/service/dodo";
import { getCurrentUser } from "@/service/user";

/**
 * Creates a fresh hosted checkout session for a signed, unpaid invoice.
 * Checkout URLs are single-use and can expire, so this runs for every attempt.
 */
export const POST = withAuth(
  async (
    _request: NextRequest,
    { params }: { params?: Promise<{ userId: string; invoiceId: string }> },
  ) => {
    try {
      const resolvedParams = params ? await params : undefined;
      const userId = resolvedParams?.userId;
      const invoiceId = resolvedParams?.invoiceId;
      const currentUser = await getCurrentUser();

      if (!currentUser) return unauthorized();
      if (currentUser.role !== "Admin" && currentUser.uid !== userId) {
        return unauthorized();
      }

      if (!userId || !invoiceId) {
        return badRequest({
          errors: "User ID and Invoice ID are required.",
        });
      }

      const invoiceRef = firestoreAdmin()
        .collection(PSF_INVOICES_COLLECTION)
        .doc(invoiceId);
      const invoiceDoc = await invoiceRef.get();

      if (!invoiceDoc.exists) {
        return badRequest({ errors: "PSF invoice not found." });
      }

      const invoiceData = invoiceDoc.data();
      if (!invoiceData || invoiceData.userId !== userId) {
        return badRequest({
          errors: "Unauthorized: Invoice does not belong to this user.",
        });
      }

      if (invoiceData.status !== "signed") {
        return badRequest({
          errors: `Cannot pay an invoice with status "${invoiceData.status}".`,
        });
      }

      const amount = invoiceData.amount ?? invoiceData.successFeeAmount;
      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return badRequest({
          errors: "Invoice amount must be greater than zero.",
        });
      }

      const checkout = await createPsfInvoiceCheckoutConfig({
        userId,
        invoiceId,
        feeAmount: Math.round(amount * 100),
      });

      await invoiceRef.update({
        dodoCheckoutId: checkout.checkoutId,
        dodoCheckoutUrl: checkout.url,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json(
        { success: true, url: checkout.url },
        { status: 200 },
      );
    } catch (error) {
      console.error("Failed to create PSF invoice checkout:", error);
      return internalServerError("Failed to start invoice payment.");
    }
  },
);

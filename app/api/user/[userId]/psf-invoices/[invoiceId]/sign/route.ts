import { NextRequest, NextResponse } from "next/server";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getCurrentUser } from "@/service/user";
import { saveFeeAgreementToPDF } from "@/service/fee-agreement-pdf";
import { createPsfInvoiceCheckoutConfig } from "@/service/dodo";
import { PSF_INVOICES_COLLECTION } from "@/constant/collection-name";

/**
 * POST /api/user/[userId]/psf-invoices/[invoiceId]/sign
 * Signs a PSF success fee invoice, generates the fee agreement PDF,
 * creates a Dodo checkout link, and updates the invoice status.
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

      // Verify the authenticated user matches the route userId (or is admin)
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return unauthorized();
      }
      if (currentUser.role !== "Admin" && currentUser.uid !== userId) {
        return unauthorized();
      }

      if (!userId || !invoiceId) {
        return badRequest({
          errors: "User ID and Invoice ID are required.",
        });
      }

      const body = await request.json();
      const { signature, ipAddress } = body;

      if (!signature || !signature.type || !signature.value) {
        return badRequest({
          errors:
            "Signature with type ('type' | 'draw') and value is required.",
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
          errors: "Unauthorized: Invoice does not belong to this user.",
        });
      }

      let resolvedIp = ipAddress || signature.ipAddress;
      if (!resolvedIp || resolvedIp === "Unknown") {
        const forwardedFor = request.headers.get("x-forwarded-for");
        resolvedIp =
          (request as any).ip ||
          (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
          request.headers.get("x-real-ip") ||
          "Unknown";
      }

      // Prepare signature object for PDF compilation
      const pdfSignature = {
        type: signature.type as "type" | "draw",
        value: signature.value,
        ipAddress: resolvedIp,
        macAddress: signature.macAddress || "",
      };

      // 1. Save fee agreement to PDF
      if (invoiceData.type !== "custom") {
        try {
          await saveFeeAgreementToPDF(
            invoiceData.referenceNumber,
            userId,
            pdfSignature,
            invoiceData.approvedAmount,
            invoiceData.successFeeAmount,
            invoiceData.successFeePercentage,
          );
        } catch (pdfError: any) {
          console.error("Error generating/saving fee agreement PDF:", pdfError);
          return internalServerError(
            "Failed to generate and save fee agreement PDF.",
          );
        }
      }

      // 2. Generate a Dodo checkout link for successFeeAmount
      let checkoutId: string;
      let checkoutUrl: string;

      try {
        const dodoConfig = await createPsfInvoiceCheckoutConfig({
          userId,
          invoiceId,
          feeAmount: Math.round(
            (invoiceData.amount ?? invoiceData.successFeeAmount) * 100,
          ),
        });
        checkoutId = dodoConfig.checkoutId;
        checkoutUrl = dodoConfig.url;
      } catch (dodoError: any) {
        console.error("Error creating Dodo checkout config:", dodoError);
        return internalServerError(
          "Failed to generate Dodo payment checkout link.",
        );
      }

      // 3. Update the invoice document inside PSF_INVOICES_COLLECTION
      const signedAt = new Date().toISOString();
      const updatedAt = signedAt;

      const updatedSignature = {
        type: signature.type,
        value: signature.value,
        signedAt,
        ipAddress: resolvedIp,
      };

      await invoiceRef.update({
        status: "signed",
        signature: updatedSignature,
        dodoCheckoutId: checkoutId,
        dodoCheckoutUrl: checkoutUrl,
        updatedAt,
      });

      return NextResponse.json(
        { success: true, url: checkoutUrl },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Failed to sign PSF invoice:", error);
      return internalServerError(
        "An error occurred while signing the invoice.",
      );
    }
  },
);

import { NextRequest, NextResponse } from "next/server";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  badRequest,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getCurrentUser, getUserById } from "@/service/user";
import { createPsfInvoiceCheckoutConfig } from "@/service/whop";
import { sendTriggerEmail } from "@/service/trigger-email";
import { generateInvoicePDF } from "@/service/invoice-pdf";
import { uploadDocument } from "@/service/documents";
import { PSF_INVOICES_COLLECTION } from "@/constant/collection-name";
import { EmailJobs } from "@/schema/trigger-email";

/** Format currency helper for email content */
function formatInvoiceUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * POST /api/user/[userId]/psf-invoices/[invoiceId]/send
 * Admin-only: sends the invoice by generating a Whop checkout link,
 * creating an invoice PDF, and emailing it to the client.
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
        return unauthorized("Only admins can send invoices.");
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
        return badRequest({ errors: "Invoice not found." });
      }

      const invoiceData = invoiceDoc.data();
      if (!invoiceData) {
        return badRequest({ errors: "Invoice data is empty." });
      }

      if (invoiceData.userId !== userId) {
        return badRequest({
          errors: "Invoice does not belong to this user.",
        });
      }

      // Only allow sending pending invoices
      if (invoiceData.status !== "pending") {
        return badRequest({
          errors: `Cannot send an invoice with status "${invoiceData.status}". Only pending invoices can be sent.`,
        });
      }

      // Generate Whop checkout link
      let checkoutId: string;
      let checkoutUrl: string;

      try {
        const whopConfig = await createPsfInvoiceCheckoutConfig({
          userId,
          invoiceId,
          feeAmount: invoiceData.amount ?? invoiceData.successFeeAmount,
        });
        checkoutId = whopConfig.checkoutId;
        checkoutUrl = whopConfig.url;
      } catch (whopError: any) {
        console.error("Error creating Whop checkout config:", whopError);
        return internalServerError(
          "Failed to generate Whop payment checkout link.",
        );
      }

      // Generate invoice PDF
      const isCustom = invoiceData.type === "custom";
      const invoiceTitle = isCustom
        ? invoiceData.title || "Custom Invoice"
        : `Performance Success Fee - ${invoiceData.bankName || "Approved Funding"}`;
      const feeAmount = invoiceData.amount ?? invoiceData.successFeeAmount ?? 0;

      let pdfFilename: string;
      let pdfBase64: string;

      try {
        const pdfResult = await generateInvoicePDF(
          userId,
          invoiceId,
          invoiceTitle,
          invoiceData.items,
          feeAmount,
          invoiceData.description,
        );
        pdfFilename = pdfResult.filename;
        pdfBase64 = pdfResult.pdfBuffer.toString("base64");
      } catch (pdfError: any) {
        console.error("Error generating invoice PDF:", pdfError);
        return internalServerError("Failed to generate invoice PDF.");
      }

      // Fetch user for email
      let userEmail: string;
      let clientName: string;

      try {
        const user = await getUserById(userId);
        if (!user || !user.email) {
          return badRequest({
            errors: "User not found or missing email address.",
          });
        }
        userEmail = user.email;
        clientName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Client";
      } catch (userError: any) {
        console.error("Error fetching user:", userError);
        return internalServerError("Failed to fetch user data.");
      }

      // Build email content
      const itemRows =
        (invoiceData.items || []).length > 0
          ? (
              invoiceData.items as Array<{
                description: string;
                quantity: number;
                rate: number;
                amount: number;
              }>
            )
              .map(
                (item) => `
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatInvoiceUSD(item.rate)}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatInvoiceUSD(item.amount)}</td>
                </tr>`,
              )
              .join("")
          : `<tr>
            <td colspan="4" style="padding: 16px; text-align: center; color: #6b7280;">
              ${invoiceData.description || "Services rendered"}</td>
           </tr>`;

      const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e40af; font-size: 24px; margin: 0;">CEG United LLC</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Invoice from Credit Elevation Group</p>
      </div>
      
      <p style="color: #111827; font-size: 16px; margin: 0 0 8px;">Hello ${clientName},</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        Please find your invoice <strong>${invoiceTitle}</strong> attached. 
        The total amount due is <strong>${formatInvoiceUSD(feeAmount)}</strong>.
      </p>

      <!-- Line Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px 12px; text-align: left; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
            <th style="padding: 10px 12px; text-align: center; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
            <th style="padding: 10px 12px; text-align: right; color: #374151; border-bottom: 2px solid #e5e7eb;">Rate</th>
            <th style="padding: 10px 12px; text-align: right; color: #374151; border-bottom: 2px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; color: #111827;">Total Due</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #2563eb; font-size: 16px;">${formatInvoiceUSD(feeAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Payment Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${checkoutUrl}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Pay Invoice Now
        </a>
      </div>

      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        If you have any questions, please contact us at <a href="mailto:info@cegunited.com" style="color: #2563eb;">info@cegunited.com</a>
      </p>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 16px;">
      © ${new Date().getFullYear()} CEG United LLC. All rights reserved.
    </p>
  </div>
</body>
</html>`;

      // Send email with PDF attachment via Firebase Trigger Email
      let emailId: string;
      try {
        emailId = await sendTriggerEmail({
          to: userEmail,
          message: {
            subject: `Invoice from CEG United — ${invoiceTitle}`,
            html: emailHtml,
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBase64,
                contentType: "application/pdf",
                encoding: "base64",
              },
            ],
          },
          job: EmailJobs.GENERAL,
        });
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        return internalServerError(
          "Failed to send invoice email. The checkout link was created but the email was not sent.",
        );
      }

      // Upload PDF to user documents for record-keeping
      try {
        const pdfFile = new File(
          [Buffer.from(pdfBase64, "base64")],
          pdfFilename,
          { type: "application/pdf" },
        );
        await uploadDocument({
          userId,
          file: pdfFile,
          documentType: "INVOICE",
          customMetadata: {
            invoiceId,
            documentType: "INVOICE",
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (uploadError: any) {
        // Non-fatal: log but don't fail the whole request
        console.error("Error uploading invoice PDF to documents:", uploadError);
      }

      // Update the invoice document
      const now = new Date().toISOString();

      await invoiceRef.update({
        status: "signed",
        sentAt: now,
        whopCheckoutId: checkoutId,
        whopCheckoutUrl: checkoutUrl,
        updatedAt: now,
      });

      return NextResponse.json(
        {
          success: true,
          url: checkoutUrl,
          emailId,
        },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Failed to send invoice:", error);
      return internalServerError(
        "An error occurred while sending the invoice.",
      );
    }
  },
);

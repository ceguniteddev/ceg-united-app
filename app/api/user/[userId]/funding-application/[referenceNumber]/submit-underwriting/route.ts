import { NextRequest, NextResponse } from "next/server";
import { badRequest, forbidden, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { updatePathwayStatus } from "@/service/apply-funding";
import { getBanks } from "@/service/bank-management";
import { sendTriggerEmail } from "@/service/trigger-email";
import { EmailJobs } from "@/schema/trigger-email";
import { getUserById, getUserDocuments } from "@/service/user";
import { getClientEntitlements } from "@/service/course-capabilities";

export const POST = withAuth(
  async (
    request: NextRequest,
    {
      params,
    }: { params?: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const userId = resolvedParams?.userId;
      const referenceNumber = resolvedParams?.referenceNumber;

      if (!userId || !referenceNumber) {
        return badRequest({
          errors: "User ID and Reference Number are required",
        });
      }

      const user = await getUserById(userId);
      if (!user) {
        return badRequest({ errors: "User not found" });
      }

      // 1. Update application status to under-review
      const body = await request.json().catch(() => ({}));
      const pathwayId = body.pathwayId;

      if (pathwayId && pathwayId !== "income_based") {
        const entitlements = await getClientEntitlements(userId);
        if (!entitlements.hasPlatformAccess) {
          return forbidden(
            "CEG Brain Platform Access is required for this funding pathway.",
          );
        }
      }

      if (pathwayId) {
        await updatePathwayStatus({
          referenceNumber,
          pathwayId,
          status: "Sent to Brokerage",
        });
      }

      // 2. Fetch all brokerages
      const banks = await getBanks();
      const brokerages = banks.filter((bank) => bank.isBrokerage);

      if (pathwayId === "income_based" && brokerages.length > 0) {
        const brokerageEmails = brokerages
          .flatMap((b) => b.contacts?.map((c) => c.email))
          .filter(Boolean);

        // 3. Send email to brokerages
        if (brokerageEmails.length > 0) {
          const clientName = `${user.firstName} ${user.lastName}`;
          const subject = `New Income-Based Funding Deal Submitted: ${clientName}`;
          const htmlContent = `
            <h2>New Income-Based Funding Deal Submission</h2>
            <p>A new client has completed the required document uploads for an income-based funding deal.</p>
            <ul>
              <li><strong>Client Name:</strong> ${clientName}</li>
              <li><strong>Client Email:</strong> ${user.email}</li>
              <li><strong>Reference Number:</strong> ${referenceNumber}</li>
            </ul>
            <p>Please review the attached documents and shop the deal with lenders.</p>
          `;

          // Fetch user documents to attach to the email
          const userDocs = await getUserDocuments({ userId });
          const relevantPrefixes = [
            "EIN_LETTER_",
            "ARTICLES_OF_ORGANIZATION_",
            "VOIDED_CHECK_",
            "DRIVERS_LICENSE_",
            "BANK_STATEMENTS_",
          ];

          const relevantDocs = userDocs.filter((doc) => {
            const fileName = doc.name.split("/").pop() || "";
            return relevantPrefixes.some((prefix) =>
              fileName.startsWith(prefix),
            );
          });

          // Use the `path` property to link directly to the signed URL
          // This avoids the 1MB Firestore document limit that would occur if we converted them all to base64
          const attachments = relevantDocs.map((doc) => {
            return {
              filename: doc.name.split("/").pop() || "document",
              path: doc.signedUrl || doc.downloadUrl,
              contentType: doc.contentType || "application/octet-stream",
            };
          });

          await sendTriggerEmail({
            to: brokerageEmails,
            replyTo: process.env.OFFER_EMAIL || "offer@cegunited.com",
            message: {
              subject,
              html: htmlContent,
              attachments: attachments.length > 0 ? attachments : undefined,
            },
            job: EmailJobs.OFFER,
          });
        }
      }

      return NextResponse.json(
        { message: "Submitted for underwriting successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error submitting for underwriting:", error);
      return internalServerError();
    }
  },
);

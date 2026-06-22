import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import {
  updateApplicationStatus,
  getApplyFundingByReferenceNumber,
} from "@/service/apply-funding";
import { saveFeeAgreementToPDF } from "@/service/fee-agreement-pdf";
import { getBankById } from "@/service/bank-management";
import { getUserById } from "@/service/user";
import { sendTriggerEmail } from "@/service/trigger-email";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  BROKER_CLIENT_MAPPING,
  USER_COLLECTION,
  USER_FUNDING_APPLICATION,
} from "@/constant/collection-name";

export const PUT = withAuth(
  async (
    request: NextRequest,
    {
      params,
    }: { params?: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const referenceNumber = resolvedParams?.referenceNumber;
      const userId = resolvedParams?.userId;

      if (!referenceNumber || !userId) {
        return badRequest({
          errors: "Reference Number and User ID are required",
        });
      }

      const body = await request.json();
      const {
        status,
        signature,
        fundingAmount,
        feeAmount,
        percentageFee,
        offerId,
      } = body;

      if (!status) {
        return badRequest({ errors: "Status is required" });
      }

      await updateApplicationStatus({
        referenceNumber,
        status,
        approveOrDeclineValue: undefined,
      });

      if (signature) {
        if (!signature.ipAddress || signature.ipAddress === "Unknown") {
          const forwardedFor = request.headers.get("x-forwarded-for");
          signature.ipAddress =
            (request as any).ip ||
            (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
            request.headers.get("x-real-ip") ||
            "Unknown";
        }
      }

      if (signature) {
        const db = firestoreAdmin();
        await db
          .collection(USER_FUNDING_APPLICATION)
          .doc(referenceNumber)
          .set({ signature }, { merge: true })
          .catch(() => {});
      }

      if (
        signature &&
        fundingAmount !== undefined &&
        feeAmount !== undefined &&
        percentageFee !== undefined
      ) {
        try {
          await saveFeeAgreementToPDF(
            referenceNumber,
            userId,
            signature,
            fundingAmount,
            feeAmount,
            percentageFee,
          );
        } catch (pdfError) {
          console.error("Error saving fee agreement PDF:", pdfError);
          // Continuing without throwing so the status update succeeds
        }
      }

      if (status === "Offer Accepted" && offerId) {
        try {
          const appData = await getApplyFundingByReferenceNumber({
            referenceNumber,
          });
          const user = await getUserById(userId);
          const acceptedOffer = (appData as any)?.offers?.find(
            (o: any) => o.id === offerId,
          );

          if (acceptedOffer && user) {
            let emailTo = null;
            let companyOrBrokerName = "Broker";

            // 1. Try to get the specific brokerage email from the offer
            if (acceptedOffer.brokerageId) {
              const brokerage = await getBankById(acceptedOffer.brokerageId);
              const brokerageEmail = brokerage?.contacts?.[0]?.email;
              if (brokerage && brokerageEmail) {
                emailTo = brokerageEmail;
                companyOrBrokerName = brokerage.bankName;
              }
            }

            // 2. Fallback to the client's assigned broker if no specific brokerage is linked to the offer
            if (!emailTo) {
              const db = firestoreAdmin();
              const mappingSnapshot = await db
                .collection(BROKER_CLIENT_MAPPING)
                .where("clientId", "==", userId)
                .where("status", "==", "Active")
                .limit(1)
                .get();

              if (!mappingSnapshot.empty) {
                const brokerId = mappingSnapshot.docs[0].data().brokerId;
                const brokerDoc = await db
                  .collection(USER_COLLECTION)
                  .doc(brokerId)
                  .get();
                if (brokerDoc.exists) {
                  const brokerData = brokerDoc.data();
                  if (brokerData?.email) {
                    emailTo = brokerData.email;
                    companyOrBrokerName = `${brokerData.firstName} ${brokerData.lastName}`;
                  }
                }
              }
            }

            if (emailTo) {
              const clientName = `${user.firstName} ${user.lastName}`;
              const htmlContent = `
                <p>Hello ${companyOrBrokerName},</p>
                <p>Client <strong>${clientName}</strong> agrees to the terms of the deal for <strong>${acceptedOffer.lenderName}</strong>.</p>
                <p>Could you please send out contracts to the client for this deal to their email address: <a href="mailto:${user.email}">${user.email}</a>.</p>
                <br/>
                <h3>Offer Details:</h3>
                <ul>
                  <li><strong>Deal Type:</strong> ${acceptedOffer.dealType}</li>
                  <li><strong>Lender:</strong> ${acceptedOffer.lenderName}</li>
                  <li><strong>Funding Amount:</strong> $${Number(acceptedOffer.fundingAmount).toLocaleString()}</li>
                  <li><strong>Payback Amount:</strong> $${Number(acceptedOffer.paybackAmount).toLocaleString()}</li>
                  <li><strong>Term:</strong> ${acceptedOffer.termLength} ${acceptedOffer.termUnit}</li>
                </ul>
                <br/>
                <p>Thank you,</p>
                <p><strong>CEG United</strong></p>
              `;

              await sendTriggerEmail({
                to: emailTo,
                message: {
                  subject: `Client ${clientName} Accepted Funding Offer`,
                  html: htmlContent,
                },
                job: "OFFER_ACCEPTED_BROKERAGE_NOTIFICATION" as any,
              });
            }
          }
        } catch (emailError) {
          console.error("Error sending offer accepted email:", emailError);
        }
      }

      return NextResponse.json(
        { message: "Status updated successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error updating status:", error);
      return internalServerError();
    }
  },
);

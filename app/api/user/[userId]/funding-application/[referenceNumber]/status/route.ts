import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import {
  updateApplicationStatus,
  getApplyFundingByReferenceNumber,
} from "@/service/apply-funding";
import { saveFeeAgreementToPDF } from "@/service/fee-agreement-pdf";
import { getBrokerageById } from "@/service/brokerage";
import { getUserById } from "@/service/user";
import { sendTriggerEmail } from "@/service/trigger-email";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  BROKER_CLIENT_MAPPING,
  USER_COLLECTION,
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
      const { status, signature, fundingAmount, feeAmount, offerId } = body;

      if (!status) {
        return badRequest({ errors: "Status is required" });
      }

      await updateApplicationStatus(referenceNumber, status, undefined);

      if (signature && fundingAmount !== undefined && feeAmount !== undefined) {
        try {
          await saveFeeAgreementToPDF(
            referenceNumber,
            userId,
            signature,
            fundingAmount,
            feeAmount,
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
              const brokerage = await getBrokerageById(
                acceptedOffer.brokerageId,
              );
              if (brokerage && brokerage.email) {
                emailTo = brokerage.email;
                companyOrBrokerName = brokerage.companyName;
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
                <h2>Client Accepted Offer</h2>
                <p>Hello ${companyOrBrokerName},</p>
                <p>The client <strong>${clientName}</strong> has accepted the funding offer from <strong>${acceptedOffer.lenderName}</strong> for <strong>$${Number(acceptedOffer.fundingAmount).toLocaleString()}</strong>.</p>
                <p>The client accepts to send over contracts. The lender will email the client the contracts.</p>
                <br/>
                <p><strong>Reference Number:</strong> ${referenceNumber}</p>
                <p>Thank you.</p>
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

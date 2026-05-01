import { renderToBuffer, Document } from "@react-pdf/renderer";
import React from "react";
import { uploadDocument } from "./documents";
import { getApplyFundingByReferenceNumber } from "./apply-funding";
import { getUserById } from "./user";
import { FeeAgreementDocument } from "@/components/pdf/FeeAgreementDocument";
import { logError, logInfo } from "@/lib/logger";

export const saveFeeAgreementToPDF = async (
  referenceNumber: string,
  userId: string,
  signature: { type: "type" | "draw"; value: string },
  fundingAmount: number,
  feeAmount: number,
  percentageFee: number,
) => {
  logInfo("saveFeeAgreementToPDF", { referenceNumber, userId });

  try {
    const applicationData = await getApplyFundingByReferenceNumber({
      referenceNumber,
    });

    const user = await getUserById(userId);

    if (!applicationData) {
      throw new Error("No application data found for this reference number");
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(
        Document,
        null,
        React.createElement(FeeAgreementDocument, {
          referenceNumber,
          clientName: user ? `${user.firstName} ${user.lastName}` : "Client",
          fundingAmount,
          feeAmount,
          percentageFee,
          signature,
          acceptedAt: new Date().toISOString(),
        }),
      ),
    );

    const filename = `${referenceNumber}_fee_agreement.pdf`;
    const file = new File([new Uint8Array(pdfBuffer)], filename, {
      type: "application/pdf",
    });

    // Upload to user documents
    const result = await uploadDocument(userId, file, "FEE_AGREEMENT", {
      referenceNumber,
      documentType: "FEE_AGREEMENT",
      generatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error: any) {
    logError(new Error(`saveFeeAgreementToPDF error: ${error.message}`));
    throw error;
  }
};

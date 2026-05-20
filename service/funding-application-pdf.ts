import { renderToBuffer, Document } from "@react-pdf/renderer";
import React from "react";
import { uploadDocument } from "./documents";
import { getApplyFundingByReferenceNumber } from "./apply-funding";
import { getUserById } from "./user";
import { FundingApplicationDocument } from "@/components/pdf/FundingApplicationDocument";
import { logError, logInfo } from "@/lib/logger";

export const saveApplicationToPDF = async (
  referenceNumber: string,
  userId: string,
) => {
  logInfo("saveApplicationToPDF", { referenceNumber, userId });

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
        React.createElement(FundingApplicationDocument, {
          application: applicationData,
          user: user as any,
        }),
      ),
    );

    const filename = `${referenceNumber}.pdf`;
    const file = new File([new Uint8Array(pdfBuffer)], filename, {
      type: "application/pdf",
    });

    const result = await uploadDocument({
      userId,
      file,
      documentType: "FUNDING_APPLICATION",
      customMetadata: {
        referenceNumber,
        documentType: "FUNDING_APPLICATION",
        generatedAt: new Date().toISOString(),
      },
    });

    return result;
  } catch (error: any) {
    logError(new Error(`saveApplicationToPDF error: ${error.message}`));
    throw error;
  }
};

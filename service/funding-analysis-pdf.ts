"use server";

import { storageAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import { getAnalysis } from "./analysis";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { FundingAnalysisDocument } from "@/components/pdf/FundingAnalysisDocument";
import React from "react";

/**
 * Converts the funding analysis HTML content to PDF and saves it to Firebase Storage
 * in the user's documents folder
 *
 * @param referenceNumber - The funding application reference number
 * @param userId - The user ID
 * @returns Object containing the GCS path and file metadata
 */
export const saveAnalysisToPDF = async (
  referenceNumber: string,
  userId: string
) => {
  logInfo("saveAnalysisToPDF", { referenceNumber, userId });

  try {
    // Fetch all analysis data for this reference number
    const analysisData = await getAnalysis(referenceNumber);

    if (!analysisData || analysisData.length === 0) {
      throw new Error("No analysis data found for this reference number");
    }

    // Generate PDF using @react-pdf/renderer
    // We pass the raw analysis data to the component, which handles HTML parsing
    const pdfBuffer = await renderToBuffer(
      React.createElement(
        Document,
        null,
        React.createElement(FundingAnalysisDocument, {
          analysisData,
          referenceNumber,
        })
      )
    );

    // Upload to Firebase Storage
    const filename = `funding-analysis-${referenceNumber}.pdf`;
    const gcsPath = `documents/${userId}/${filename}`;

    const bucket = storageAdmin();
    const file = bucket.file(gcsPath);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: {
          referenceNumber,
          documentType: "FUNDING_ANALYSIS",
          generatedAt: new Date().toISOString(),
        },
      },
    });

    logInfo("saveAnalysisToPDF success", { gcsPath, size: pdfBuffer.length });

    return {
      gcsPath,
      filename,
      size: pdfBuffer.length,
      contentType: "application/pdf",
    };
  } catch (error: any) {
    logError(new Error(`saveAnalysisToPDF error: ${error.message}`));
    throw error;
  }
};

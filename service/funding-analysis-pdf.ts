"use server";

import { storageAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import puppeteer from "puppeteer";
import { getAnalysis } from "./analysis";

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

    // Combine all analysis sections into a single HTML document
    const htmlContent = generateAnalysisHTML(analysisData, referenceNumber);

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent);

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

/**
 * Generates a formatted HTML document from analysis data
 */
function generateAnalysisHTML(
  analysisData: any[],
  referenceNumber: string
): string {
  const sections = analysisData
    .map((item, index) => {
      const content = extractHtmlFromFence(item.analysis || "");
      return `
        <div class="analysis-section">
          ${content}
        </div>
        ${
          index < analysisData.length - 1
            ? '<div class="page-break"></div>'
            : ""
        }
      `;
    })
    .join("\n");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Funding Analysis - ${referenceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          padding: 40px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #1e40af;
        }
        
        .header h1 {
          font-size: 28px;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .header .reference {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        
        .header .generated-date {
          font-size: 11px;
          color: #999;
          margin-top: 5px;
        }
        
        .analysis-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .page-break {
          page-break-after: always;
        }
        
        h1, h2, h3, h4, h5, h6 {
          margin-top: 20px;
          margin-bottom: 12px;
          color: #1e40af;
        }
        
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        h4 { font-size: 16px; }
        h5 { font-size: 14px; }
        h6 { font-size: 12px; }
        
        p {
          margin-bottom: 12px;
        }
        
        ul, ol {
          margin-left: 25px;
          margin-bottom: 12px;
        }
        
        li {
          margin-bottom: 6px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        
        th {
          background-color: #1e40af;
          color: white;
          font-weight: 600;
        }
        
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        strong, b {
          font-weight: 600;
          color: #1e40af;
        }
        
        em, i {
          font-style: italic;
        }
        
        code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }
        
        pre {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          margin: 15px 0;
        }
        
        blockquote {
          border-left: 4px solid #1e40af;
          padding-left: 20px;
          margin: 15px 0;
          color: #666;
          font-style: italic;
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          
          .page-break {
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Funding Application Analysis</h1>
        <div class="reference">Reference Number: ${referenceNumber}</div>
        <div class="generated-date">Generated: ${new Date().toLocaleString()}</div>
      </div>
      
      ${sections}
      
      <div class="footer">
        <p>This document was automatically generated from the funding analysis system.</p>
        <p>CEG United LLC - Confidential</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates a PDF buffer from HTML content using Puppeteer
 */
async function generatePDFFromHTML(html: string): Promise<Buffer> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extracts HTML content from code fences (if present)
 * Copied from AnalysisView.tsx to maintain consistency
 */
function extractHtmlFromFence(input: string): string {
  if (!input) return "";

  // Prefer an explicit ```html fence anywhere in the string
  const htmlFence = /```(?:\s*html)?\s*[\r\n]+([\s\S]*?)\s*```/i;
  const m1 = input.match(htmlFence);
  if (m1) return m1[1].trim();

  // If the entire string is *just* one fenced block (any language), unwrap it
  const wholeFence = /^\s*```[^\n]*\n([\s\S]*?)\n?```\s*$/;
  const m2 = input.match(wholeFence);
  if (m2) return m2[1].trim();

  // Otherwise, return as-is
  return input.trim();
}

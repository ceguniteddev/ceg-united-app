import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Document } from "@react-pdf/renderer";
import { getUserById } from "./user";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import { logError, logInfo } from "@/lib/logger";
import { PsfInvoiceItem } from "@/schema/psf-invoice";

export interface InvoicePdfResult {
  pdfBuffer: Buffer;
  filename: string;
}

export const generateInvoicePDF = async (
  userId: string,
  invoiceId: string,
  invoiceTitle: string,
  items: PsfInvoiceItem[] | undefined,
  totalAmount: number,
  memo?: string,
): Promise<InvoicePdfResult> => {
  logInfo("generateInvoicePDF", { userId, invoiceId });

  try {
    const user = await getUserById(userId);
    const clientName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Client"
      : "Client";

    const invoiceDate = new Date().toISOString();
    const dueDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const pdfBuffer = await renderToBuffer(
      React.createElement(
        Document,
        null,
        React.createElement(InvoiceDocument, {
          invoiceTitle,
          clientName,
          invoiceDate,
          dueDate,
          items: items || [],
          totalAmount,
          memo,
          invoiceId,
        }),
      ),
    );

    const filename = `invoice_${invoiceId.substring(0, 8)}.pdf`;

    return {
      pdfBuffer: Buffer.from(pdfBuffer),
      filename,
    };
  } catch (error: any) {
    logError(new Error(`generateInvoicePDF error: ${error.message}`));
    throw error;
  }
};

import * as functions from "firebase-functions/v2/https";
// import * as Lob from "@lob/lob-typescript-sdk";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
import { PDFDocument } from "pdf-lib";

const LOB_API_KEY = defineSecret("LOB_API_KEY");

export const mailLetter = functions.onCall(
  {
    secrets: [LOB_API_KEY],
    invoker: "public",
    cors: [
      "http://localhost:3000",
      "https://raccoon-robust-likely.ngrok-free.app",
      "https://staging.cegunited.com",
      "https://app.cegunited.com",
    ],
  },
  async (req) => {
    if (!req.auth)
      throw new functions.HttpsError("unauthenticated", "Sign in required");
    const {
      disputeId,
      agencyKey,
      letterPdfBase64,
      attachmentPdfsBase64, // string[]
      mailingMethod, // 'first-class' | 'certified' | 'certified-rr'
      toAddress,
      toName,
      fromAddress,
      fromName,
    } = req.data;

    // 1. Combine letter + attachments into one PDF (Lob accepts a single file)
    const merged = await PDFDocument.create();
    const all = [letterPdfBase64, ...(attachmentPdfsBase64 || [])];
    for (const b64 of all) {
      const src = await PDFDocument.load(Buffer.from(b64, "base64"));
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    if (merged.getPageCount() > 60) {
      throw new functions.HttpsError(
        "failed-precondition",
        "Lob accepts max 60 pages.",
      );
    }
    const mergedPdfBytes = await merged.save();

    // 2. Send to Lob via native fetch
    const extraService =
      mailingMethod === "certified"
        ? "certified"
        : mailingMethod === "certified-rr"
          ? "certified_return_receipt"
          : undefined;

    const formData = new FormData();
    formData.append("to[name]", toName || "Unknown Agency");
    formData.append("to[address_line1]", toAddress?.line1 || "Unknown Address");
    if (toAddress?.line2) formData.append("to[address_line2]", toAddress.line2);
    formData.append("to[address_city]", toAddress?.city || "Unknown City");
    formData.append("to[address_state]", toAddress?.state || "XX");
    formData.append("to[address_zip]", toAddress?.zip || "00000");
    formData.append("to[address_country]", "US");

    formData.append("from[name]", fromName || "Credit Experts Group LLC");
    formData.append("from[address_line1]", fromAddress?.line1 || "123 CEG Way");
    formData.append("from[address_city]", fromAddress?.city || "Anytown");
    formData.append("from[address_state]", fromAddress?.state || "NY");
    formData.append("from[address_zip]", fromAddress?.zip || "10001");
    formData.append("from[address_country]", "US");

    formData.append("color", "false");
    formData.append("address_placement", "top_first_page");
    formData.append("mail_type", "usps_first_class");
    if (extraService) {
      formData.append("extra_service", extraService);
    }
    formData.append("use_type", "operational");
    formData.append("double_sided", "true");

    const pdfBlob = new Blob([mergedPdfBytes as any], {
      type: "application/pdf",
    });
    formData.append("file", pdfBlob, "letter.pdf");

    const authStr = Buffer.from(`${LOB_API_KEY.value()}:`).toString("base64");
    const lobRes = await fetch("https://api.lob.com/v1/letters", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authStr}`,
        "Idempotency-Key": `${disputeId}:${agencyKey}:${Date.now()}`,
      },
      body: formData,
    });

    if (!lobRes.ok) {
      const errText = await lobRes.text();
      console.error("Lob API error:", errText);
      throw new functions.HttpsError(
        "internal",
        `Lob API error: ${lobRes.status}`,
      );
    }
    const letter = (await lobRes.json()) as any;

    // 3. Persist tracking back to Firestore
    const projectId = process.env.GCLOUD_PROJECT || "cegunitedllc";
    const databaseId =
      projectId === "ceg-united-llc-prod"
        ? "ceg-united-db-production"
        : "ceg-united-db-staging";
    const db = getFirestore(databaseId);

    await db.doc(`disputes/${disputeId}/generatedLetters/${agencyKey}`).set(
      {
        mailedAt: FieldValue.serverTimestamp(),
        lobId: letter.id,
        trackingNumber: letter.tracking_number,
        expectedDeliveryDate: letter.expected_delivery_date,
        carrier: letter.carrier,
        mailingMethod,
        mailingStatus: "mailed",
      },
      { merge: true },
    );

    return {
      success: true,
      lobId: letter.id,
      trackingNumber: letter.tracking_number,
      expectedDelivery: letter.expected_delivery_date,
      carrier: letter.carrier,
      mailedFrom:
        letter.from && typeof letter.from !== "string"
          ? letter.from.address_city
          : "Lob facility",
      pageCount: merged.getPageCount(),
      totalPrice: (letter as any).expected_price ?? 0,
      mailedAt: new Date().toISOString(),
    };
  },
);

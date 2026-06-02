import * as functions from "firebase-functions/v2/https";
import * as Lob from "@lob/lob-typescript-sdk";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
import { PDFDocument } from "pdf-lib";

const LOB_API_KEY = defineSecret("LOB_API_KEY");

export const mailLetter = functions.onCall(
  { secrets: [LOB_API_KEY] },
  async (req) => {
    if (!req.auth)
      throw new functions.HttpsError("unauthenticated", "Sign in required");
    const {
      disputeId,
      agencyKey,
      letterPdfBase64,
      attachmentPdfsBase64, // string[]
      mailingMethod, // 'first-class' | 'certified' | 'certified-rr'
    } = req.data;

    const dispute = await admin.firestore().doc(`disputes/${disputeId}`).get();
    const letterData = dispute.data()?.generatedLetters[agencyKey];

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
    const mergedB64 = Buffer.from(await merged.save()).toString("base64");

    // 2. Send to Lob
    const lob = new Lob.LettersApi(
      new Lob.Configuration({ username: LOB_API_KEY.value() }),
    );
    const extraService =
      mailingMethod === "certified"
        ? Lob.LetterEditableExtraServiceEnum.Certified
        : mailingMethod === "certified-rr"
          ? Lob.LetterEditableExtraServiceEnum.CertifiedReturnReceipt
          : undefined;

    const letter = await lob.create(
      {
        to: {
          name: letterData?.agencyName || "Unknown Agency",
          address_line1: letterData?.addressLine1 || "Unknown Address",
          address_line2: letterData?.addressLine2 || "",
          address_city: letterData?.city || "Unknown City",
          address_state: letterData?.state || "XX",
          address_zip: letterData?.zipCode || "00000",
          address_country: Lob.CountryExtended.Us,
          toJSON: () => ({}),
        } as any,
        from: {
          name: "Credit Experts Group LLC",
          address_line1: "123 CEG Way",
          address_city: "Anytown",
          address_state: "NY",
          address_zip: "10001",
          address_country: Lob.CountryExtended.Us,
          toJSON: () => ({}),
        } as any,
        file: `data:application/pdf;base64,${mergedB64}`,
        color: false,
        address_placement: Lob.LetterEditableAddressPlacementEnum
          .TopFirstPage as any,
        mail_type: Lob.MailType.FirstClass as any,
        extra_service: extraService as any,
        use_type: Lob.LtrUseType.Operational as any,
        double_sided: true,
        toJSON: () => ({}),
      } as any,
      {
        headers: {
          "Idempotency-Key": `${disputeId}:${agencyKey}:${Date.now()}`,
        },
      } as any,
    );

    // 3. Persist tracking back to Firestore
    const db = getFirestore();
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

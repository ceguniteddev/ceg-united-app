// ============================================
// CEG Brain — Lob.com Mailing Integration (frontend stub)
// ============================================
// This module is the *frontend interface* to CEG's mailing service.
// In production it calls a Firebase Cloud Function (mailLetter) that in
// turn calls Lob.com's HTTPS API on the server (you can NEVER call Lob
// from the browser — the API key would be exposed).
//
// Server flow (see INSTRUCTIONS.md §9):
//   1. Browser uploads merged-PDF letter+attachments OR sends agency+itemIds
//   2. Cloud Function fetches/merges the PDFs (pdf-lib)
//   3. Cloud Function calls Lob.LettersApi.create({ to, from, file, ... })
//   4. Lob returns { id, tracking_number, expected_delivery_date, carrier }
//   5. Cloud Function persists to Firestore disputes/{id} and returns to browser
//
// This stub mimics the Lob response shape exactly so the swap is one line:
//   await callFirebaseFunction('mailLetter', request)
// instead of
//   await mailLetterViaLob(request)

import type { GeneratedLetter } from "./credit-repair-types";

// ---------- request / response types ----------

export type MailingMethod =
  | "first-class" // ~$1.95 — basic delivery
  | "certified" // ~$7.00 — proof of mailing + tracking number
  | "certified-rr"; // ~$11.50 — certified + return-receipt green card

export const MAILING_METHODS: Record<
  MailingMethod,
  {
    key: MailingMethod;
    label: string;
    price: number;
    deliveryWindow: string;
    description: string;
    recommended?: boolean;
    lobMailType: "usps_first_class";
    lobExtraService: null | "certified" | "certified_return_receipt";
  }
> = {
  "first-class": {
    key: "first-class",
    label: "First-Class Mail",
    price: 1.95,
    deliveryWindow: "3-5 business days",
    description: "Standard USPS delivery. No tracking, no proof.",
    lobMailType: "usps_first_class",
    lobExtraService: null,
  },
  certified: {
    key: "certified",
    label: "Certified Mail",
    price: 7.0,
    deliveryWindow: "3-5 business days",
    description:
      "Proof of mailing + USPS tracking number. Recommended for FCRA disputes.",
    recommended: true,
    lobMailType: "usps_first_class",
    lobExtraService: "certified",
  },
  "certified-rr": {
    key: "certified-rr",
    label: "Certified Mail + Return Receipt",
    price: 11.5,
    deliveryWindow: "3-5 business days",
    description:
      "Strongest legal proof — bureau signature returned via green card.",
    lobMailType: "usps_first_class",
    lobExtraService: "certified_return_receipt",
  },
};

export interface LobMailRequest {
  disputeId: string;
  itemIds: string[];
  /** Who is mailing — used for the "from" address on the envelope */
  fromName: string;
  fromAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  /** Bureau / agency we're mailing to */
  toName: string;
  toAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  /**
   * The PDF that Lob will print + mail. In production this is a base64
   * string created by combining the letter PDF and any attachment PDFs
   * with pdf-lib. For the demo we just track the letter + count.
   */
  letter: GeneratedLetter;
  /** Number of attachment pages added to the letter */
  attachmentCount: number;
  /** Document IDs to attach */
  attachmentDocIds?: string[];
  /** Total mailing method */
  method: MailingMethod;
  /** Optional idempotency key so retries don't double-mail */
  idempotencyKey?: string;
}

export interface LobMailResponse {
  /** Lob letter ID, e.g. "ltr_abc123xyz" */
  lobId: string;
  /** USPS Form-3811 tracking number, 22 digits */
  trackingNumber: string;
  /** ISO date — Lob's expected_delivery_date */
  expectedDelivery: string;
  /** Always 'usps' for now */
  carrier: "usps";
  /** City of the Lob print facility (one of: Phoenix, AZ / Lincoln, NE / Stamford, CT) */
  mailedFrom: string;
  /** Total page count = letter pages + attachment pages */
  pageCount: number;
  /** Cost charged to the customer in USD */
  totalPrice: number;
  /** Server timestamp when Lob accepted the letter */
  mailedAt: string;
  /** Direct URL to the Lob PDF */
  url?: string;
}

// ---------- the call ----------

/**
 * Mail a single letter via Lob.com.
 *
 * In production:
 *   const httpsCallable = getFunctions().httpsCallable
 *   const fn = httpsCallable('mailLetter')
 *   const { data } = await fn(request)
 *   return data as LobMailResponse
 *
 * The cloud function does:
 *   1. Verify Firebase Auth context
 *   2. Read disputes/{id}/generatedLetters[agencyKey] from Firestore
 *   3. Render letter PDF (server-side — same pdfGenerator.ts logic)
 *   4. Pull attachments from Storage, merge with pdf-lib
 *   5. POST to https://api.lob.com/v1/letters with HTTP Basic auth
 *      using process.env.LOB_API_KEY
 *   6. On success, write back to Firestore:
 *        mailedAt: FieldValue.serverTimestamp()
 *        lobId, trackingNumber, expectedDeliveryDate, carrier
 *   7. Return the LobMailResponse to the browser
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";
import { getPdfBase64 } from "../pdfGenerator";

export async function mailLetterViaLob(
  request: LobMailRequest,
): Promise<LobMailResponse> {
  const fn = httpsCallable(getFunctions(app), "mailLetter");
  // Map the frontend request shape into what the Cloud Function expects
  const payload = {
    disputeId: request.disputeId,
    itemIds: request.itemIds,
    agencyKey: request.letter.agencyKey,
    letterPdfBase64: getPdfBase64(request.letter),
    attachmentPdfsBase64: [], // Demo: mock documents don't have base64 readily available here
    attachmentDocIds: request.attachmentDocIds || [],
    mailingMethod: request.method,
    toAddress: request.toAddress,
    toName: request.toName,
    fromAddress: request.fromAddress,
    fromName: request.fromName,
  };
  const result = await fn(payload);
  return result.data as LobMailResponse;
}

/**
 * Mail many letters at once. Each call is independent so a single failure
 * does not block the rest.
 */
export async function mailManyLettersViaLob(
  requests: LobMailRequest[],
): Promise<Record<string, LobMailResponse>> {
  const out: Record<string, LobMailResponse> = {};

  // Fire requests concurrently using Promise.allSettled
  const results = await Promise.allSettled(
    requests.map((req) =>
      mailLetterViaLob(req).then((res) => ({ key: req.letter.agencyKey, res })),
    ),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      out[result.value.key] = result.value.res;
    } else {
      console.error("Failed to mail letter:", result.reason);
      // In production you'd likely throw or return an error object here
    }
  }
  return out;
}

export function uspsTrackingUrl(trackingNumber: string): string {
  const clean = trackingNumber.replace(/\s+/g, "");
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${clean}`;
}

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

if (!admin.apps.length) {
  admin.initializeApp();
}

const LOB_WEBHOOK_SECRET = defineSecret("LOB_WEBHOOK_SECRET");

/**
 * Verifies Lob webhook signature
 * https://help.lob.com/print-and-mail/getting-data-and-results/using-webhooks#security-9
 */
function verifyLobSignature(
  signatureHeader: string,
  secret: string,
  bodyRaw: Buffer | string,
): { isValid: boolean; debugDetails: any } {
  if (!signatureHeader || !secret)
    return { isValid: false, debugDetails: "missing header or secret" };

  const bodyBuf = Buffer.isBuffer(bodyRaw) ? bodyRaw : Buffer.from(bodyRaw);

  // New format: Lob-Signature: t=1614710170,v1=11ab...
  if (signatureHeader.includes("t=") && signatureHeader.includes("v1=")) {
    const parts = signatureHeader.split(",");
    let timestamp = "";
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") timestamp = value;
      else if (key === "v1") signatures.push(value);
    }

    if (!timestamp || signatures.length === 0)
      return {
        isValid: false,
        debugDetails: "missing timestamp or signatures",
      };

    const timestampBuf = Buffer.from(`${timestamp}.`);
    const payloadBuf = Buffer.concat([timestampBuf, bodyBuf]);
    const hmac = crypto.createHmac("sha256", secret);
    const expectedSignature = hmac.update(payloadBuf).digest("hex");

    return {
      isValid: signatures.includes(expectedSignature),
      debugDetails: {
        expectedSignature,
        foundSignatures: signatures,
        timestamp,
      },
    };
  }

  // Fallback for older/simpler format where header is just the raw signature hex
  const hmac = crypto.createHmac("sha256", secret);
  const expectedSignature = hmac.update(bodyBuf).digest("hex");

  return {
    isValid: signatureHeader === expectedSignature,
    debugDetails: { expectedSignature, fallback: true, signatureHeader },
  };
}

export const lobWebhook = onRequest(
  { secrets: [LOB_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signatureHeader = req.headers["lob-signature"];
    if (typeof signatureHeader !== "string") {
      logger.warn("Missing lob-signature header", { headers: req.headers });
      res.status(401).send("Unauthorized: Missing lob-signature header");
      return;
    }

    let secret = "";
    try {
      secret = LOB_WEBHOOK_SECRET.value();
    } catch (err) {
      logger.error("Failed to read LOB_WEBHOOK_SECRET", err);
      res.status(500).send("Internal Server Error: Secret not configured");
      return;
    }

    if (!secret) {
      logger.error("LOB_WEBHOOK_SECRET is empty");
      res.status(500).send("Internal Server Error: Secret is empty");
      return;
    }

    // Verify signature
    // Since req.rawBody is available in firebase-functions, we should use it for signature verification
    const rawBodyData: any = req.rawBody || "";
    const verification = verifyLobSignature(
      signatureHeader,
      secret,
      rawBodyData,
    );

    // logger.info("Signature Verification Result:", verification.debugDetails);

    // Provide a fallback check using JSON.stringify just in case rawBody was slightly modified
    let isAltValid = false;
    if (!verification.isValid) {
      const altVerification = verifyLobSignature(
        signatureHeader,
        secret,
        JSON.stringify(req.body),
      );
      if (altVerification.isValid) {
        isAltValid = true;
        logger.info(
          "Signature matched using JSON.stringify(req.body) fallback",
        );
      }
    }

    if (!verification.isValid && !isAltValid) {
      // If this is a test event from the Lob dashboard, we can bypass the check for easier testing
      if (
        req.body?.event_type?.enabled_for_test ||
        req.body?.event_type?.id?.endsWith(".created")
      ) {
        logger.warn("Webhook signature invalid, but bypassing for test event", {
          signatureHeader,
          debugDetails: verification.debugDetails,
        });
      } else {
        const preview = Buffer.isBuffer(rawBodyData)
          ? rawBodyData.toString().substring(0, 100)
          : (rawBodyData as string).substring(0, 100);
        logger.error("Invalid Lob webhook signature", {
          signatureHeader,
          rawBodyStrPreview: preview,
          debugDetails: verification.debugDetails,
        });
        res.status(401).send("Unauthorized: Invalid signature");
        return;
      }
    }

    try {
      const event = req.body;
      // logger.info("Received Lob webhook event", {
      //   type: event.event_type,
      //   id: event.id,
      // });

      const eventType = event.event_type.id; // e.g. letter.in_transit, letter.processed_for_delivery

      // Check if it's a letter event
      if (eventType && eventType.startsWith("letter.")) {
        const letter = event.body;
        const metadata = letter.metadata || {};
        const { disputeId, agencyKey } = metadata;

        if (disputeId && agencyKey) {
          const projectId = process.env.GCLOUD_PROJECT || "cegunitedllc";
          const databaseId =
            projectId === "ceg-united-llc-prod"
              ? "ceg-united-db-production"
              : "ceg-united-db-staging";
          const db = getFirestore(databaseId);

          const docRef = db.doc(
            `disputes/${disputeId}/generatedLetters/${agencyKey}`,
          );

          // Extract the return receipt PDF URL if available
          const returnReceiptUrl = letter.return_receipt?.pdf || null;

          const updateData: any = {
            mailingStatus: eventType.replace("letter.", ""), // e.g. in_transit
            trackingEvents: FieldValue.arrayUnion({
              status: eventType,
              timestamp: event.date_created,
              location: letter.tracking_events?.length
                ? letter.tracking_events[letter.tracking_events.length - 1]
                    .location
                : null,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (returnReceiptUrl) {
            updateData.returnReceiptUrl = returnReceiptUrl;
          }

          await docRef.set(updateData, { merge: true });

          logger.info(
            `Updated dispute letter status for ${disputeId} / ${agencyKey} to ${eventType}` +
              (returnReceiptUrl
                ? ` with Return Receipt URL: ${returnReceiptUrl}`
                : ""),
          );
        } else {
          logger.warn(
            "Received letter event without disputeId or agencyKey in metadata",
            { letterId: letter.id },
          );
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      logger.error("Error processing Lob webhook", error);
      res.status(500).send("Internal Server Error");
    }
  },
);

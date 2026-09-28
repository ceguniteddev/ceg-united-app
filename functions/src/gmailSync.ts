import { onSchedule } from "firebase-functions/v2/scheduler";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { gmail_v1 } from "googleapis";
import { getGmailClient } from "./gmailClient";
import { getDb } from "./db";

const gmailKeySecret = defineSecret("GMAIL_SERVICE_ACCOUNT_KEY");

function getStorageBucket() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  return admin.storage().bucket();
}

const TOPIC_NAME =
  "projects/ceg-united-llc-prod/topics/gmail-inbound-contact-cegunited";
const TARGET_MAILBOX = "contact@cegunited.com";

/**
 * Step 3: Auto-Renew Gmail Watch every 24 hours (Gmail watch subscriptions expire every 7 days)
 */
export const renewGmailWatch = onSchedule(
  {
    schedule: "every 24 hours",
    secrets: [gmailKeySecret],
    timeZone: "America/New_York",
  },
  async () => {
    try {
      const secretVal = gmailKeySecret.value();
      if (!secretVal) {
        logger.error("GMAIL_SERVICE_ACCOUNT_KEY secret is not set");
        return;
      }

      const gmail = await getGmailClient(secretVal, TARGET_MAILBOX);

      const res = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: TOPIC_NAME,
          labelIds: ["INBOX"],
        },
      });

      logger.info("Gmail watch renewed successfully", {
        historyId: res.data.historyId,
        expiration: res.data.expiration,
      });

      // Initialize lastHistoryId if not already stored
      const db = getDb();
      const syncDocRef = db.collection("crm_settings").doc("gmail_sync");
      const syncDoc = await syncDocRef.get();
      if (!syncDoc.exists || !syncDoc.data()?.lastHistoryId) {
        await syncDocRef.set(
          {
            lastHistoryId: res.data.historyId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }
    } catch (error) {
      logger.error("Failed to renew Gmail watch", error);
    }
  },
);

/**
 * Step 4: Pub/Sub Consumer Function triggering on inbound email notifications
 */
export const onGmailInbound = onMessagePublished(
  {
    topic: "gmail-inbound-contact-cegunited",
    memory: "1GiB",
    timeoutSeconds: 180,
    secrets: [gmailKeySecret],
  },
  async (event) => {
    try {
      const secretVal = gmailKeySecret.value();
      if (!secretVal) {
        logger.error("GMAIL_SERVICE_ACCOUNT_KEY secret is missing");
        return;
      }

      const rawPayload = Buffer.from(
        event.data.message.data,
        "base64",
      ).toString("utf-8");
      const { emailAddress, historyId } = JSON.parse(rawPayload);

      if (emailAddress !== TARGET_MAILBOX) {
        logger.info(
          `Ignoring notification for non-target mailbox: ${emailAddress}`,
        );
        return;
      }

      const db = getDb();
      const gmail = await getGmailClient(secretVal, emailAddress);

      // 1. Fetch lastHistoryId from Firestore
      const syncDocRef = db.collection("crm_settings").doc("gmail_sync");
      const syncDoc = await syncDocRef.get();
      const lastHistoryId = syncDoc.data()?.lastHistoryId;

      if (!lastHistoryId) {
        logger.info("Initial sync checkpoint set to historyId", { historyId });
        await syncDocRef.set({ lastHistoryId: historyId }, { merge: true });
        return;
      }

      // 2. Fetch history records since lastHistoryId
      let historyList: gmail_v1.Schema$History[] = [];
      try {
        const historyRes = await gmail.users.history.list({
          userId: "me",
          startHistoryId: String(lastHistoryId),
          historyTypes: ["messageAdded"],
        });
        historyList = historyRes.data.history || [];
      } catch (err: any) {
        // If historyId is out of date or purged by Gmail, reset pointer
        if (err?.code === 404 || err?.status === 404) {
          logger.warn(
            "HistoryId expired or purged by Gmail. Resetting pointer.",
            {
              historyId,
            },
          );
          await syncDocRef.set({ lastHistoryId: historyId }, { merge: true });
          return;
        }
        throw err;
      }

      const addedMessages = historyList
        .flatMap((h) => h.messagesAdded || [])
        .map((m) => m.message!)
        .filter(Boolean);

      for (const msgItem of addedMessages) {
        if (!msgItem.id) continue;

        // 3. Fetch Full Message from Gmail API
        const msgRes = await gmail.users.messages.get({
          userId: "me",
          id: msgItem.id,
          format: "full",
        });

        const msg = msgRes.data;
        const headersList = msg.payload?.headers || [];
        const headers: Record<string, string> = {};
        for (const h of headersList) {
          if (h.name && h.value) {
            headers[h.name.toLowerCase()] = h.value;
          }
        }

        const fromHeader = headers["from"] || "";
        const toHeader = headers["to"] || "";
        const subject = headers["subject"] || "(No Subject)";
        const threadId = msg.threadId || msg.id;
        const dateStr = headers["date"]
          ? new Date(headers["date"]).toISOString()
          : new Date().toISOString();

        // Extract sender email: "Jane Doe <jane@domain.com>" -> "jane@domain.com"
        const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
        const senderEmail = (emailMatch[1] || fromHeader).trim().toLowerCase();

        // Skip outbound or system self-loops
        if (senderEmail === TARGET_MAILBOX) continue;

        // 4. Idempotency Check: Verify message not already stored
        const existingIx = await db
          .collectionGroup("interactions")
          .where("providerId", "==", msg.id)
          .limit(1)
          .get();

        if (!existingIx.empty) {
          logger.info(`Message ${msg.id} already processed. Skipping.`);
          continue;
        }

        // 5. Match or Auto-Create Client
        let clientId: string;
        const userQuery = await db
          .collection("user")
          .where("email", "==", senderEmail)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          clientId = userQuery.docs[0].id;
        } else {
          // Create new Client document so no email is ever lost
          const newDocRef = db.collection("user").doc();
          clientId = newDocRef.id;
          const senderName =
            fromHeader.replace(/<[^>]+>/, "").trim() ||
            senderEmail.split("@")[0] ||
            "New Client";

          await newDocRef.set({
            firstName: senderName,
            lastName: "",
            email: senderEmail,
            role: "Client",
            registrationDate: dateStr,
            registrationPurpose: "General Inquiry",
            activeStatus: "Active",
            vip: false,
            highPriority: false,
            createdAt: dateStr,
            updatedAt: dateStr,
          });
          logger.info(
            `Created new client ${clientId} for sender ${senderEmail}`,
          );
        }

        // 6. Parse Body & Upload Attachments
        const { textBody, attachments } = await parseMessagePayload(
          gmail,
          msg,
          clientId,
        );

        // 7. Write Interaction to user/{clientId}/interactions
        const interactionId = `ix_gmail_${msg.id}`;
        const ixRef = db
          .collection(`user/${clientId}/interactions`)
          .doc(interactionId);

        await ixRef.set({
          id: interactionId,
          clientId,
          channel: "email",
          direction: "in",
          ts: dateStr,
          from: senderEmail,
          to: toHeader,
          subject,
          body: textBody,
          threadId,
          attachments,
          provider: "gmail",
          providerId: msg.id,
          repId: null,
          aiHandled: false,
          status: "received",
          createdAt: new Date().toISOString(),
        });

        // 8. Update Client Summary Document
        await db
          .collection("user")
          .doc(clientId)
          .set(
            {
              unreadCount: FieldValue.increment(1),
              lastInboundAt: dateStr,
              lastMessagePreview: subject || textBody.slice(0, 100),
              lastChannel: "email",
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );

        logger.info(
          `Captured email ${msg.id} from ${senderEmail} into client ${clientId}`,
        );
      }

      // 9. Update lastHistoryId
      await syncDocRef.set(
        {
          lastHistoryId: historyId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (error) {
      logger.error("Error processing inbound Gmail Pub/Sub event", error);
    }
  },
);

/**
 * Step 5: MIME & Attachment Parser Helper
 */
async function parseMessagePayload(
  gmail: gmail_v1.Gmail,
  msg: gmail_v1.Schema$Message,
  clientId: string,
) {
  const storage = getStorageBucket();
  let textBody = "";
  const rawAttachments: Array<{
    name: string;
    mimeType: string;
    attachmentId: string;
  }> = [];

  function traverseParts(part?: gmail_v1.Schema$MessagePart) {
    if (!part) return;

    if (part.mimeType === "text/plain" && part.body?.data) {
      textBody += Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.mimeType === "text/html" && !textBody && part.body?.data) {
      const html = Buffer.from(part.body.data, "base64").toString("utf-8");
      textBody = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    }

    if (part.filename && part.body?.attachmentId) {
      rawAttachments.push({
        name: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.parts) {
      for (const child of part.parts) {
        traverseParts(child);
      }
    }
  }

  traverseParts(msg.payload);

  const processedAttachments: Array<{
    type: "image" | "file";
    url: string;
    name: string;
    mimeType: string;
  }> = [];

  for (const item of rawAttachments) {
    try {
      const attData = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: msg.id!,
        id: item.attachmentId,
      });

      if (attData.data.data) {
        const buffer = Buffer.from(attData.data.data, "base64");
        const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `clients/${clientId}/attachments/${Date.now()}_${safeName}`;
        const file = storage.file(storagePath);

        await file.save(buffer, {
          contentType: item.mimeType,
          metadata: { originalName: item.name },
        });

        // Generate signed URL (valid for long-term secure preview)
        const [downloadUrl] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2035",
        });

        processedAttachments.push({
          type: item.mimeType.startsWith("image/")
            ? ("image" as const)
            : ("file" as const),
          url: downloadUrl,
          name: item.name,
          mimeType: item.mimeType,
        });
      }
    } catch (err) {
      logger.error(`Failed to save attachment ${item.name}`, err);
    }
  }

  return {
    textBody: textBody.trim() || "(No body content)",
    attachments: processedAttachments,
  };
}

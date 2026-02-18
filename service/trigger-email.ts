"use server";
import { MAIL_COLLECTION } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { TriggerEmail } from "@/schema/trigger-email";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Sends an email by adding a document to the 'mail' collection,
 * which is monitored by the Firebase Trigger Email extension.
 *
 * @param emailData The email data including to, message (subject, text/html), etc.
 * @returns The ID of the created document
 */
export const sendTriggerEmail = async (emailData: TriggerEmail) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(MAIL_COLLECTION);

  const docRef = await collectionRef.add({
    ...emailData,
    from: emailData.from || "CEG United LLC <noreply@cegunited.com>",
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
};
/**
 * Checks the status of a sent email by its document ID.
 * The extension updates the document with a 'delivery' field.
 *
 * @param emailId The ID of the email document
 * @returns The delivery status or null if not yet processed
 */
export const getTriggerEmailStatus = async (emailId: string) => {
  const db = firestoreAdmin();
  const docRef = db.collection(MAIL_COLLECTION).doc(emailId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Email document not found");
  }

  const data = doc.data();
  return data?.delivery || null;
};

export const getTriggerEmails = async (limit = 100) => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(MAIL_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  }));
};

export const retryTriggerEmail = async (id: string) => {
  const db = firestoreAdmin();
  const docRef = db.collection(MAIL_COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Email not found");
  }

  const data = doc.data() as TriggerEmail & { delivery?: any; createdAt?: any };

  // Create a clean copy without metadata
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { delivery, createdAt, ...emailData } = data;

  // Use the existing send function to ensure consistency
  return sendTriggerEmail(emailData);
};

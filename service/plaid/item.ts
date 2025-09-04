import { PLAID_ITEM_WEBHOOK_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import { Timestamp } from "firebase-admin/firestore";

export const recordWebhookData = async (webhookData: PlaidWebhookData) => {
  logInfo("recordWebhookData", { webhookData });
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_ITEM_WEBHOOK_COLLECTION);

  await collectionRef.add({
    ...webhookData,
    createdAt: Timestamp.now(),
  });
};

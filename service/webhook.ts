import { WEBHOOK_DATA_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const recordWebhookData = async (webhookData: any) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(WEBHOOK_DATA_COLLECTION);

  await collectionRef.add({
    ...webhookData,
    createdAt: Timestamp.now(),
  });
};

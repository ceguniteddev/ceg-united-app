"use server";
import {
  NEW_ACCOUNTS_AVAILABLE,
  PLAID_ITEM_WEBHOOK_COLLECTION,
  USER_LINK_UPDATE_MODE,
} from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import { Timestamp } from "firebase-admin/firestore";
import { getAccessToken, getItem } from ".";
import { normalizeAllDates } from "@/lib/date-parser";

export const recordWebhookData = async (webhookData: PlaidItemWebhookData) => {
  logInfo("recordWebhookData", { webhookData });

  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_ITEM_WEBHOOK_COLLECTION);

  await collectionRef.add({
    ...webhookData,
    createdAt: Timestamp.now(),
  });

  if (webhookData.webhook_code === "PENDING_DISCONNECT") {
    const collectionRef = db.collection(USER_LINK_UPDATE_MODE);
    await collectionRef.add({
      ...webhookData,
      createdAt: Timestamp.now(),
    });
  }

  if (webhookData.webhook_code === "NEW_ACCOUNTS_AVAILABLE") {
    const collectionRef = db.collection(NEW_ACCOUNTS_AVAILABLE);
    await collectionRef.add({
      ...webhookData,
      createdAt: Timestamp.now(),
    });
  }

  if (webhookData.webhook_code === "LOGIN_REPAIRED") {
    await removeItemLinkUpdateModeData(webhookData.item_id);
  }
};

export const getItemLinkUpdateModeData = async (userId: string) => {
  logInfo("getLinkUpdateModeData", { userId });
  const db = firestoreAdmin();

  // Get all Plaid tokens for this user
  const plaidTokens = await getAccessToken(userId, "ITEM");
  if (!plaidTokens) return null;

  // Query USER_LINK_UPDATE_MODE collection for ITEM type
  const snapshot = await db
    .collection(USER_LINK_UPDATE_MODE)
    .where("webhook_type", "==", "ITEM")
    .get();
  if (snapshot.empty) return null;

  // Build map: itemId -> Plaid accessToken
  const tokenMap = new Map(plaidTokens.map((t) => [t.itemId, t.accessToken]));

  // Normalize and filter snapshot docs to ones that match user's itemIds
  const matchedDocs = snapshot.docs
    .map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }))
    .filter((doc) => tokenMap.has(doc.item_id));

  if (matchedDocs.length === 0) return null;

  // For each matched doc, fetch its institution name
  const results = await Promise.all(
    matchedDocs.map(async (doc) => {
      try {
        const accessToken = tokenMap.get(doc.item_id)!;

        // 1. Get item info (contains institution_id)
        const item = await getItem({ accessToken });

        const institutionName = item?.institution_name ?? null;

        return { ...doc, institution_name: institutionName };
      } catch (err: any) {
        logError(err, { item_id: doc.item_id });
        return { ...doc, institution_name: null };
      }
    })
  );

  return results;
};

export const getItemLinkUpdateModeNewAccount = async (userId: string) => {
  logInfo("getLinkUpdateModeData", { userId });
  const db = firestoreAdmin();

  // Get all Plaid tokens for this user
  const plaidTokens = await getAccessToken(userId, "ITEM");
  if (!plaidTokens) return null;

  // Query USER_LINK_UPDATE_MODE collection for ITEM type
  const snapshot = await db
    .collection(NEW_ACCOUNTS_AVAILABLE)
    .where("webhook_type", "==", "ITEM")
    .get();
  if (snapshot.empty) return null;

  // Build map: itemId -> Plaid accessToken
  const tokenMap = new Map(plaidTokens.map((t) => [t.itemId, t.accessToken]));

  // Normalize and filter snapshot docs to ones that match user's itemIds
  const matchedDocs = snapshot.docs
    .map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }))
    .filter((doc) => tokenMap.has(doc.item_id));

  if (matchedDocs.length === 0) return null;

  // For each matched doc, fetch its institution name
  const results = await Promise.all(
    matchedDocs.map(async (doc) => {
      try {
        const accessToken = tokenMap.get(doc.item_id)!;

        // 1. Get item info (contains institution_id)
        const item = await getItem({ accessToken });

        const institutionName = item?.institution_name ?? null;

        return { ...doc, institution_name: institutionName };
      } catch (err: any) {
        logError(err, { item_id: doc.item_id });
        return { ...doc, institution_name: null };
      }
    })
  );

  return results;
};

export const removeItemLinkUpdateModeData = async (itemId: string) => {
  logInfo("removeItemLinkUpdateModeData", { itemId });
  if (!itemId) throw new Error("Item id is required");

  const db = firestoreAdmin();
  const snapshot = await db.collection(USER_LINK_UPDATE_MODE).where("item_id", "==", itemId).get();

  if (snapshot.empty) return null;

  // Collect all delete promises
  const deletes = snapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(deletes);

  return true;
};

export const removeItemLinkUpdateModeNewAccount = async (itemId: string) => {
  logInfo("removeItemLinkUpdateModeNewAccount", { itemId });

  if (!itemId) throw new Error("Item id is required");

  const db = firestoreAdmin();
  const snapshot = await db.collection(NEW_ACCOUNTS_AVAILABLE).where("item_id", "==", itemId).get();

  if (snapshot.empty) return null;

  // Collect all delete promises
  const deletes = snapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(deletes);

  return true;
};

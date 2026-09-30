"use server";
import * as crypto from "node:crypto";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { API_KEYS_COLLECTION } from "@/constant/collection-name";
import { ApiKeyRecord } from "@/schema/api-key";
import { normalizeAllDates } from "@/lib/date-parser";

export async function getApiKeys(): Promise<ApiKeyRecord[]> {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(API_KEYS_COLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  })) as ApiKeyRecord[];
}

export async function createApiKeyAction(input: {
  name: string;
  scopes: string[];
  burstPerMinute?: number;
  hourlyQuota?: number;
  expiresInDays?: number;
  env?: "live" | "test";
}): Promise<{ rawKey: string; keyRecord: ApiKeyRecord }> {
  const db = firestoreAdmin();
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const env = input.env || "live";
  const rawKey = `ceg_${env}_${randomBytes}`;
  const prefix = rawKey.slice(0, 16);
  const hash = crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
  const keyId = `key_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();

  let expiresAt: string | null = null;
  if (input.expiresInDays) {
    const exp = new Date();
    exp.setDate(exp.getDate() + input.expiresInDays);
    expiresAt = exp.toISOString();
  }

  const record: ApiKeyRecord = {
    id: keyId,
    name: input.name,
    keyPrefix: prefix,
    keyHash: hash,
    scopes: input.scopes,
    rateLimit: {
      burstPerMinute: input.burstPerMinute || 600,
      hourlyQuota: input.hourlyQuota || 10000,
    },
    status: "active",
    createdAt: now,
    expiresAt,
    lastUsedAt: null,
  };

  await db.collection(API_KEYS_COLLECTION).doc(keyId).set(record);
  return { rawKey, keyRecord: record };
}

export async function revokeApiKeyAction(keyId: string): Promise<boolean> {
  const db = firestoreAdmin();
  await db.collection(API_KEYS_COLLECTION).doc(keyId).update({
    status: "revoked",
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export async function activateApiKeyAction(keyId: string): Promise<boolean> {
  const db = firestoreAdmin();
  await db.collection(API_KEYS_COLLECTION).doc(keyId).update({
    status: "active",
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export async function deleteApiKeyAction(keyId: string): Promise<boolean> {
  const db = firestoreAdmin();
  await db.collection(API_KEYS_COLLECTION).doc(keyId).delete();
  return true;
}

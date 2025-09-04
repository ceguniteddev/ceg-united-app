"use server";
import { USER_COLLECTION, USER_FUNDING_APPLICATION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { ApplyFunding, ApplyFundingWithUser } from "@/schema/apply-funding";
import { Timestamp } from "firebase-admin/firestore";
import * as crypto from "node:crypto";

export const applyFunding = async (value: ApplyFunding) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_FUNDING_APPLICATION);

  const { id: referenceNumber } = await createReferenceId();

  const docRef = collectionRef.doc(referenceNumber);
  await docRef.set({ ...value });
  const data = (await docRef.get()).data();

  // call n8n webhook to capture AI analysis
  await fetch(`${process.env.n8n_HOST}/funding-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      referenceNumber,
      userId: value.userId,
    }),
  });

  return {
    referenceNumber: docRef.id,
    ...normalizeAllDates(data),
  };
};

export const getApplyFunding = async (userId: string): Promise<ApplyFunding[] | null> => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_FUNDING_APPLICATION).where("userId", "==", userId);
  const snapshot = await collectionRef.orderBy("appliedDate", "asc").get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }
  return snapshot.docs.map((doc) => ({
    referenceNumber: doc.id,
    ...normalizeAllDates(doc.data()),
  }));
};

export const getFundingApplications = async (
  state?: string
): Promise<ApplyFundingWithUser[] | null> => {
  const db = firestoreAdmin();
  let collectionRef = db.collection(USER_FUNDING_APPLICATION).orderBy("appliedDate", "asc");

  if (state) {
    collectionRef = collectionRef.where("addressState", "==", state);
  }
  const snapshot = await collectionRef.get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  // get all users
  const usersSnap = await db.collection(USER_COLLECTION).get();
  if (usersSnap.empty) {
    console.log("No matching documents.");
    return null;
  }

  const usersMap: Record<string, any> = {};
  usersSnap.forEach((doc) => {
    usersMap[doc.id] = {
      userId: doc.id,
      ...normalizeAllDates(doc.data()),
    };
  });

  return snapshot.docs.map((doc) => {
    const data = normalizeAllDates(doc.data());
    const userId = data.userId;
    return {
      referenceNumber: doc.id,
      ...data,
      user: usersMap[userId] ?? null,
    };
  });
};

export const getApplyFundingByReferenceNumber = async (
  referenceNumber: string
): Promise<ApplyFunding | null> => {
  if (!referenceNumber) {
    throw new AppError("Reference number is required.");
  }
  const db = firestoreAdmin();
  const doc = await db.collection(USER_FUNDING_APPLICATION).doc(referenceNumber).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...normalizeAllDates(doc.data()) };
};

export const deleteApplyFunding = async (referenceNumber: string): Promise<void> => {
  if (!referenceNumber) {
    throw new AppError("Reference number is required.");
  }

  const data = await getApplyFundingByReferenceNumber(referenceNumber);
  if (!data) {
    throw new AppError("Funding application not found.");
  }

  if (data.status !== "New") {
    throw new AppError("Funding application cannot be deleted.");
  }

  const db = firestoreAdmin();
  await db.collection(USER_FUNDING_APPLICATION).doc(referenceNumber).delete();
};

export async function createReferenceId(): Promise<{ id: string; path: string }> {
  const db = firestoreAdmin();
  const collection = USER_FUNDING_APPLICATION;
  const maxAttempts = 50;

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = buildRef("FUNDING"); // e.g., FUNDING-20250901-7KM3Z9QX
    const ref = db.collection(collection).doc(candidate);
    try {
      await ref.create({ createdAt: Timestamp.now() }); // atomic "insert if not exists"
      return { id: candidate, path: ref.path };
    } catch (e: any) {
      if ((e?.code === 6 || e?.code === "already-exists") && i < maxAttempts - 1) continue;
      throw e;
    }
  }
  throw new Error("Failed to create unique reference id.");
}

/** Build IDs like: REF-YYYYMMDD-XXXXXXXX (no O/0/1/I/L to avoid confusion) */
function buildRef(prefix: string) {
  const d = new Date();
  const date =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  return `${prefix}-${date}-${randomString(8)}`; // e.g., FUNDING-20250901-7KM3Z9QX
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomString(length: number) {
  const bytes = new Uint8Array(length);
  // Modern Node (18+) and browsers expose Web Crypto:
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Node fallback if needed
    const { randomBytes } = crypto;
    const buf: Buffer = randomBytes(length);
    for (let i = 0; i < length; i++) bytes[i] = buf[i];
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

"use server";
import { GMAIL_TOKENS } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

export async function storeGmailToken(email: string, tokens: any) {
  const db = firestoreAdmin();

  await db.collection(GMAIL_TOKENS).doc(email).set(tokens);
}

export async function getGmailToken(email: string) {
  const db = firestoreAdmin();
  const doc = await db.collection(GMAIL_TOKENS).doc(email).get();
  if (!doc.exists) return null;

  const data = doc.data();

  return data;
}

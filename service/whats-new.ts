"use server";
import { WHATS_NEW_COLLECTION } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { WhatsNew } from "@/schema/whats-new";

export const recordWhatsNew = async (values: WhatsNew) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(WHATS_NEW_COLLECTION);
  await collectionRef.add(values);
};

export const getWhatsNew = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(WHATS_NEW_COLLECTION);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) } as WhatsNew)
  );
};

export const getWhatsNewActive = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(WHATS_NEW_COLLECTION).where("status", "==", "Active");
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) } as WhatsNew)
  );
};

export const deleteWhatsNew = async (id: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(WHATS_NEW_COLLECTION);
  await collectionRef.doc(id).delete();
};

export const updateWhatsNew = async (id: string, values: WhatsNew) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(WHATS_NEW_COLLECTION).doc(id);
  await collectionRef.update(values);
};

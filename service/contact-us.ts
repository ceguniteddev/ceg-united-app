"use server";
import { REQUEST_CUSTOMER_CALL } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { RequestCall } from "@/schema";

export const recordRequestCustomerCall = async (userId: string, data: RequestCall) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(REQUEST_CUSTOMER_CALL);
  await collectionRef.add({ userId, ...data, createdAt: new Date() });
};

export const getRequestsCustomerCall = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(REQUEST_CUSTOMER_CALL);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }));
};

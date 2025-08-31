"use server";
import { USER_FUNDING_APPLICATION } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { ApplyFunding } from "@/schema/apply-funding";

export const applyFunding = async (value: ApplyFunding) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_FUNDING_APPLICATION);
  console.log(value);
  const docRef = await collectionRef.add(value);
  const data = (await docRef.get()).data();

  return {
    id: docRef.id,
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
  return snapshot.docs.map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }));
};

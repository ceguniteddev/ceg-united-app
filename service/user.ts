"use server";
import { USER_COLLECTION } from "@/constant/collection-name";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";

export const getUserRecordByEmail = async (email: string) => {
  const authentication = authenticationAdmin();
  let userRecord = null;

  try {
    userRecord = await authentication.getUserByEmail(email);
  } catch (error) {
    console.info(error);
  }

  return userRecord;
};

export const getUser = async (email: string): Promise<User | null> => {
  const userRecord = await getUserRecordByEmail(email);

  if (!userRecord) return null;

  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);
  const querySnapshot = await collectionRef.where("email", "==", email).get();
  if (querySnapshot.empty) return null;

  const userDoc = querySnapshot.docs[0];

  return { id: userDoc.id, ...userDoc.data() } as User;
};

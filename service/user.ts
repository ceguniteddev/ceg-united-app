"use server";
import { PLAID_TOKEN_COLLECTION, USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";
import { sendMail } from "@/lib/nodemailer";
import { Role } from "@/schema";

import { User } from "@/schema/registration";

export const getUserRecordByEmail = async (email: string) => {
  const authentication = authenticationAdmin();
  let userRecord = null;

  try {
    userRecord = await authentication.getUserByEmail(email);
  } catch (error) {
    // console.error(error);
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
  const user = userDoc.data();

  return { id: userDoc.id, ...normalizeAllDates(user) } as User;
};

export const registerUser = async (value: User) => {
  const userRecord = await getUserRecordByEmail(value.email);

  if (userRecord) {
    throw new AppError("Cannot register duplicate email.");
  }

  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);

  const userData = { ...value };
  delete (userData as { password?: string }).password;

  const docRef = await collectionRef.add(userData);
  const data = (await docRef.get()).data();

  const authAdmin = authenticationAdmin();

  await authAdmin.createUser({
    uid: docRef.id,
    email: value.email,
    password: value.password,
    displayName: `${value.firstName} ${value.lastName}`,
    disabled: false,
    emailVerified: false,
  });

  const link = await authAdmin.generateEmailVerificationLink(value.email);

  const requestBody = `<p>Please verify your email by clicking the link below:</p>
<a href="${link}">Verify Email</a>`;

  await sendMail(value.email, "Verify your email", requestBody);

  return {
    id: docRef.id,
    ...normalizeAllDates(data),
  };
};

export const getUsers = async (role?: Role): Promise<User[]> => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);

  let query: FirebaseFirestore.Query = collectionRef;
  if (role) {
    query = collectionRef.where("role", "==", role);
  }

  const querySnapshot = await query.get();

  if (querySnapshot.empty) {
    console.log("No matching documents.");
    return [];
  }

  const plaidTokenRef = db.collection(PLAID_TOKEN_COLLECTION);
  const plaidTokenRefSnapshot = await plaidTokenRef.get();

  console.log("Plaid token documents count:", plaidTokenRefSnapshot);

  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();

    users.push({ id: doc.id, ...normalizeAllDates(data) } as User);
  });
  return users;
};

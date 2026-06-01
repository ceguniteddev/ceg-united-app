"use server";
import {
  USER_TRADELINE_COLLECTION,
  USER_COLLECTION,
} from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

export const purchaseTradeline = async (
  userId: string,
  tradelineData: Record<string, any>,
): Promise<void> => {
  const db = firestoreAdmin();
  await db.collection(USER_TRADELINE_COLLECTION).add({
    userId,
    ...tradelineData,
    createdAt: new Date().toISOString(),
  });
};

export const getUserRecentTradelines = async (
  userId: string,
): Promise<any[]> => {
  const db = firestoreAdmin();
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const snapshot = await db
    .collection(USER_TRADELINE_COLLECTION)
    .where("userId", "==", userId)
    .where("createdAt", ">=", sixtyDaysAgo.toISOString())
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getUserTradelines = async (userId: string): Promise<any[]> => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(USER_TRADELINE_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as any),
  }));

  // Sort by createdAt descending locally to avoid requiring a composite index in Firestore
  return docs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getAllPurchasedTradelines = async (): Promise<any[]> => {
  const db = firestoreAdmin();
  const snapshot = await db.collection(USER_TRADELINE_COLLECTION).get();

  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as any),
  }));

  // Extract unique userIds to minimize database reads
  const uniqueUserIds = [
    ...new Set(docs.map((doc: any) => doc.userId).filter(Boolean)),
  ];

  if (uniqueUserIds.length === 0) return docs;

  // Fetch all related users in parallel
  const usersSnapshot = await Promise.all(
    uniqueUserIds.map((id) =>
      db
        .collection(USER_COLLECTION)
        .doc(id as string)
        .get(),
    ),
  );

  const userMap = usersSnapshot.reduce(
    (acc, userDoc) => {
      if (userDoc.exists) {
        acc[userDoc.id] = userDoc.data();
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  // Attach user details to the tradelines
  const finalDocs = docs.map((doc: any) => ({
    ...doc,
    user: userMap[doc.userId]
      ? {
          firstName: userMap[doc.userId].firstName || "",
          lastName: userMap[doc.userId].lastName || "",
          email: userMap[doc.userId].email || "",
        }
      : null,
  }));

  // Sort by newest first
  return finalDocs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const updateTradelineStatus = async (
  id: string,
  status: string,
  reason?: string,
): Promise<void> => {
  const db = firestoreAdmin();
  const updateData: any = { status, updatedAt: new Date().toISOString() };
  if (reason !== undefined) {
    updateData.reason = reason;
  }
  await db.collection(USER_TRADELINE_COLLECTION).doc(id).update(updateData);
};

export const getPendingTradelinesCount = async (): Promise<number> => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(USER_TRADELINE_COLLECTION)
    .where("status", "==", "pending")
    .count()
    .get();

  return snapshot.data().count;
};

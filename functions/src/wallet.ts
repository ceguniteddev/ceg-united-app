import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getDb } from "./db";

export const addFunds = onCall(
  { cors: true, invoker: "public" },
  async (request) => {
    const db = getDb();
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required to add funds.");
    }

    const { amount, description, paymentId } = request.data;

    if (typeof amount !== "number" || amount <= 0) {
      throw new HttpsError(
        "invalid-argument",
        "Amount must be a positive number.",
      );
    }

    const userId = request.auth.uid;
    const walletRef = db.collection("user-wallet").doc(userId);
    const transactionRef = db.collection("user-wallet-transactions").doc();

    try {
      await db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const currentBalance = walletDoc.exists
          ? walletDoc.data()?.balance || 0
          : 0;
        const newBalance = currentBalance + amount;

        if (!walletDoc.exists) {
          transaction.set(walletRef, {
            userId,
            balance: newBalance,
            updatedAt: new Date().toISOString(),
          });
        } else {
          transaction.update(walletRef, {
            balance: newBalance,
            updatedAt: new Date().toISOString(),
          });
        }

        transaction.set(transactionRef, {
          userId,
          amount,
          type: "credit",
          description: description || "Added funds",
          createdAt: new Date().toISOString(),
          paymentId: paymentId || null,
        });
      });

      return { success: true, message: "Funds added successfully." };
    } catch (error) {
      console.error("Error adding funds:", error);
      throw new HttpsError(
        "internal",
        "Failed to add funds. Please try again later.",
      );
    }
  },
);

export const spendFunds = onCall(
  { cors: true, invoker: "public" },
  async (request) => {
    const db = getDb();
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in required to spend funds.",
      );
    }

    const { amount, description, metadata } = request.data;

    if (typeof amount !== "number" || amount <= 0) {
      throw new HttpsError(
        "invalid-argument",
        "Amount must be a positive number.",
      );
    }

    const userId = request.auth.uid;
    const walletRef = db.collection("user-wallet").doc(userId);
    const transactionRef = db.collection("user-wallet-transactions").doc();

    try {
      await db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const currentBalance = walletDoc.exists
          ? walletDoc.data()?.balance || 0
          : 0;

        if (currentBalance < amount) {
          throw new HttpsError("failed-precondition", "Insufficient funds.");
        }

        const newBalance = currentBalance - amount;

        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: new Date().toISOString(),
        });

        transaction.set(transactionRef, {
          userId,
          amount: -amount,
          type: "debit",
          description: description || "Spent funds",
          createdAt: new Date().toISOString(),
          metadata: metadata || null,
        });
      });

      return { success: true, message: "Funds spent successfully." };
    } catch (error: any) {
      console.error("Error spending funds:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      if (error.code === "failed-precondition") {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "Failed to spend funds. Please try again later.",
      );
    }
  },
);

export const getWallet = onCall(
  { cors: true, invoker: "public" },
  async (request) => {
    const db = getDb();
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in required to get wallet.",
      );
    }

    const userId = request.auth.uid;
    const walletRef = db.collection("user-wallet").doc(userId);

    try {
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists) {
        return { balance: 0, transactions: [] };
      }

      const walletData = walletDoc.data();

      // Fetch transactions
      const transactionsSnapshot = await db
        .collection("user-wallet-transactions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const transactions = transactionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        balance: walletData?.balance || 0,
        updatedAt: walletData?.updatedAt,
        transactions,
      };
    } catch (error) {
      console.error("Error getting wallet:", error);
      throw new HttpsError(
        "internal",
        "Failed to get wallet. Please try again later.",
      );
    }
  },
);

"use server";

import { logError, logInfo } from "@/lib/logger";

import { getUserById } from "../user";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";
import {
  USER_DENEFITS_CONTRACT,
  USER_WHOP_PAYMENTS,
  WHOP_CHECKOUTS_COLLECTION,
} from "@/constant/collection-name";
import { whopSdk } from "@/lib/whop-sdk";
import { Payment } from "@whop/sdk/resources.js";
import { map } from "zod";

const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID;
const productId = process.env.WHOP_PRODUCT_ID;

type CreateCheckoutConfigParams = {
  userId: string;
  referenceNumber: string;
};

/**
 * Creates a checkout configuration on Whop for a specific product using the SDK.
 *
 * @param {CreateCheckoutConfigParams} params - The parameters for creating the checkout link.
 * @returns {Promise<string>} The checkout configuration ID.
 */
export const createWhopCheckoutConfig = async ({
  userId,
  referenceNumber,
}: CreateCheckoutConfigParams): Promise<string> => {
  // logInfo("createWhopCheckoutConfig (SDK) start", { userId, referenceNumber });

  if (!whopSdk) {
    logError(new Error("Whop SDK is not initialized. Check API Key."));
    throw new Error("Server configuration error.");
  }

  if (!WHOP_COMPANY_ID) {
    logError(new Error("WHOP_COMPANY_ID is not set."));
    throw new Error("Server configuration error.");
  }

  if (!productId) {
    logError(new Error("WHOP_PRODUCT_ID is not set."));
    throw new Error("Server configuration error.");
  }

  try {
    // Check if a checkout link already exists for this referenceNumber
    const existingCheckoutQuery = await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .where("referenceNumber", "==", referenceNumber)
      .limit(1)
      .get();

    if (!existingCheckoutQuery.empty) {
      const existingCheckout = existingCheckoutQuery.docs[0].data();
      if (existingCheckout.checkoutId) {
        logInfo("Found existing checkout config for referenceNumber", {
          referenceNumber,
          checkoutId: existingCheckout.checkoutId,
        });
        return existingCheckout.checkoutId;
      }
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const planDetails = {
      company_id: WHOP_COMPANY_ID,
      currency: "usd" as const,
      initial_price: 400,
      plan_type: "one_time" as const,
      product_id: productId!,
      visibility: "hidden" as const,
    };

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: planDetails,
      metadata: {
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        referenceNumber: referenceNumber,
      },
    });

    // console.log("Whop checkoutConfig:", checkoutConfig);

    if (!checkoutConfig.id) {
      logError(
        new Error("Whop SDK did not return a checkout config ID"),
        checkoutConfig,
      );
      throw new Error("Failed to create checkout link.");
    }

    const checkoutId = checkoutConfig.id;

    // Save checkout details to Firestore

    const checkoutDoc = {
      userId,
      referenceNumber,
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      // currency: planDetails.currency,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created", // Initial status
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);
    logInfo(
      "Successfully saved whop checkout config to firestore",
      checkoutDoc,
    );

    // logInfo("createWhopCheckoutConfig (SDK) success", { checkoutId });
    return checkoutId;
  } catch (error: any) {
    logError(
      new Error(
        `createWhopCheckoutConfig (SDK) error: ${
          error.message || "Unknown error"
        }`,
      ),
    );
    throw error;
  }
};

export const recordPaymentSucceeded = async ({
  payment,
}: {
  payment: Payment;
}) => {
  const db = firestoreAdmin();

  const auth = authenticationAdmin();
  let authUser = null;

  try {
    authUser = await auth.getUserByEmail(payment.user?.email!);
  } catch (error: any) {
    console.log("User not found.");

    const collectionRef = db.collection(USER_WHOP_PAYMENTS);
    await collectionRef.add({ ...payment, userId: null });

    return null;
  }

  if (!authUser) {
    console.log("User not found.");
    return null;
  }

  const userData = await getUserById(authUser.uid);
  if (!userData) {
    console.log("User not found.");
    return null;
  }

  const collectionRef = db.collection(USER_WHOP_PAYMENTS);
  await collectionRef.add({ ...payment, userId: authUser.uid });
};

export const getWhopPayments = async () => {
  const db = firestoreAdmin();
  const paymentsRef = db.collection(USER_WHOP_PAYMENTS);
  const snapshot = await paymentsRef.orderBy("created_at", "desc").get();

  if (snapshot.empty) {
    return [];
  }

  const payments = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const paymentData = doc.data();
      let mappedUser = null;
      if (paymentData.userId) {
        try {
          mappedUser = await getUserById(paymentData.userId);
        } catch (error: any) {
          logError(
            new Error(
              `Failed to fetch user ${paymentData.userId} for whop payment ${doc.id}`,
            ),
            error.message,
          );
        }
      }

      return {
        docId: doc.id,
        ...paymentData,
        mappedEmail: mappedUser?.email || null,
        mappedFirstName: mappedUser?.firstName || null,
        mappedLastName: mappedUser?.lastName || null,
      };
    }),
  );

  return payments;
};

export const mapWhopPaymentToUser = async ({
  docId,
  userId,
}: {
  docId: string;
  userId: string;
}) => {
  const db = firestoreAdmin();

  const userData = await getUserById(userId);
  if (!userData) {
    throw new Error("User not found");
  }

  const paymentRef = db.collection(USER_WHOP_PAYMENTS).doc(docId);
  await paymentRef.update({
    userId,
    mappedEmail: userData.email,
    mappedFirstName: userData.firstName,
    mappedLastName: userData.lastName,
  });
  logInfo("Mapped Whop payment to user", { docId, userId });
  return { success: true };
};

export const unmapWhopPayment = async ({ docId }: { docId: string }) => {
  const db = firestoreAdmin();
  const paymentRef = db.collection(USER_WHOP_PAYMENTS).doc(docId);
  await paymentRef.update({
    userId: null,
    mappedEmail: null,
    mappedFirstName: null,
    mappedLastName: null,
  });
  logInfo("Unmapped Whop payment", { docId });
  return { success: true };
};

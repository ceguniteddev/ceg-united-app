"use server";

import { logError, logInfo } from "@/lib/logger";
import Whop from "@whop/sdk";
import { getUserById } from "../user";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { WHOP_CHECKOUTS_COLLECTION } from "@/constant/collection-name";

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID;
const productId = process.env.WHOP_PRODUCT_ID;

const whopSdk =
  WHOP_API_KEY &&
  new Whop({
    apiKey: WHOP_API_KEY,
  });

type CreateCheckoutParams = {
  userId: string;
  referenceNumber: string;
};

/**
 * Creates a checkout link on Whop for a specific product using the SDK.
 *
 * @param {CreateCheckoutParams} params - The parameters for creating the checkout link.
 * @returns {Promise<string>} The direct checkout URL.
 */
export const createWhopCheckoutLink = async ({
  userId,
  referenceNumber,
}: CreateCheckoutParams): Promise<string> => {
  logInfo("createWhopCheckoutLink (SDK) start", { userId, referenceNumber });

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
      if (existingCheckout.url) {
        logInfo("Found existing checkout link for referenceNumber", {
          referenceNumber,
          url: existingCheckout.url,
        });
        return existingCheckout.url;
      }
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const planDetails = {
      company_id: WHOP_COMPANY_ID,
      currency: "usd" as const,
      initial_price: 4999,
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

    if (!checkoutConfig.purchase_url) {
      logError(
        new Error("Whop SDK did not return a purchase_url"),
        checkoutConfig,
      );
      throw new Error("Failed to create checkout link.");
    }

    const url = checkoutConfig.purchase_url;

    // Save checkout details to Firestore

    const checkoutDoc = {
      userId,
      referenceNumber,
      checkoutId: checkoutConfig.id,
      url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      currency: planDetails.currency,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created", // Initial status
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);

    logInfo("createWhopCheckoutLink (SDK) success", { url });
    return url;
  } catch (error: any) {
    logError(
      new Error(
        `createWhopCheckoutLink (SDK) error: ${
          error.message || "Unknown error"
        }`,
      ),
    );
    throw error;
  }
};

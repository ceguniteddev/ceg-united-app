"use server";

import { logError, logInfo } from "@/lib/logger";
import Whop from "@whop/sdk";
import { getUserById } from "../user";

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
};

/**
 * Creates a checkout link on Whop for a specific product using the SDK.
 *
 * @param {CreateCheckoutParams} params - The parameters for creating the checkout link.
 * @returns {Promise<string>} The direct checkout URL.
 */
export const createWhopCheckoutLink = async ({
  userId,
}: CreateCheckoutParams): Promise<string> => {
  logInfo("createWhopCheckoutLink (SDK) start", { userId });

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

  console.log("Creating Whop checkout link for user:", userId);
  console.log("Using product ID:", productId);
  console.log("Using company ID:", WHOP_COMPANY_ID);

  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // const checkoutConfig = await whopSdk.checkoutConfigurations.create({
    //   company_id: WHOP_COMPANY_ID,
    //   plan: {
    //     // We link the plan to a specific product (Access Pass)
    //     // product_id: productId,
    //     company_id: WHOP_COMPANY_ID,
    //     plan_type: "one_time",
    //     currency: "usd",
    //     initial_price: 4999,
    //     // The price is configured on the Product/Plan in the Whop Dashboard
    //   },
    //   metadata: {
    //     userId: user.id,
    //     email: user.email,
    //     name: `${user.firstName} ${user.lastName}`,
    //   },
    //   //   customer_email: user.email,
    // });

    //https://whop.com/checkout/plan_4kghdIojBH1wq
    //https://whop.com/checkout/plan_AJy2EeSKuMSGM

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: {
        company_id: WHOP_COMPANY_ID,
        currency: "usd",
        initial_price: 4999,
        plan_type: "one_time",
        product_id: productId!,
      },
      metadata: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
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

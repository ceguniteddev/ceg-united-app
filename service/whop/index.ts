"use server";

import { logError, logInfo } from "@/lib/logger";

import { getUserById } from "../user";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";
import {
  PAYMENT_REQUESTS_COLLECTION,
  USER_WHOP_PAYMENTS,
  WHOP_CHECKOUTS_COLLECTION,
  USER_WALLET,
  USER_WALLET_TRANSACTIONS,
} from "@/constant/collection-name";
import { whopSdk } from "@/lib/whop-sdk";
import {
  CheckoutConfigurationCreateParams,
  Payment,
} from "@whop/sdk/resources.js";
import { PaymentPlan } from "@/schema/payments";
import { randomUUID } from "crypto";
import { sendTriggerEmail } from "../trigger-email";
import { EmailJobs } from "@/schema/trigger-email";
import { getFeeSettings } from "../fee-settings";

const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID;
const productId = process.env.WHOP_PRODUCT_ID;
const tradelineProductId = process.env.WHOP_TRADELINE_PRODUCT_ID;
const generateCRSReportProductId =
  process.env.WHOP_GENERATE_CRS_REPORT_PRODUCT_ID;

const WHOP_PRICING_PLAN_STARTER_ID = process.env.WHOP_PRICING_PLAN_STARTER_ID;
const WHOP_PRICING_PLAN_PRO_ID = process.env.WHOP_PRICING_PLAN_PRO_ID;
const WHOP_PRICING_PLAN_EXECUTIVE_ID =
  process.env.WHOP_PRICING_PLAN_EXECUTIVE_ID;
const WHOP_CREDIT_REPAIR_PRODUCT_ID = process.env.WHOP_CREDIT_REPAIR_PRODUCT_ID;
// const WHOP_CREDIT_MODULE_PRO_ID = process.env.WHOP_CREDIT_MODULE_PRO_ID;

const WHOP_FULL_PAYMENT_AMOUNT =
  process.env.NEXT_PUBLIC_WHOP_FULL_PAYMENT_AMOUNT || "15000";
// const WHOP_FINANCING_AMOUNT = process.env.WHOP_FINANCING_AMOUNT || "2500";

// Payment Amount Environment Variables
const AUDIT_FULL_AMOUNT = Number(process.env.WHOP_AUDIT_FULL_AMOUNT || "2000");
const INTELLIGENCE_FULL_AMOUNT = Number(
  process.env.WHOP_INTELLIGENCE_FULL_AMOUNT || "5000",
);
const ACCELERATOR_FULL_AMOUNT = Number(
  process.env.WHOP_ACCELERATOR_FULL_AMOUNT || "15000",
);

const AUDIT_DOWNPAYMENT_AMOUNT = Number(
  process.env.WHOP_AUDIT_DOWNPAYMENT_AMOUNT || "750",
);
const INTELLIGENCE_DOWNPAYMENT_AMOUNT = Number(
  process.env.WHOP_INTELLIGENCE_DOWNPAYMENT_AMOUNT || "1000",
);
const ACCELERATOR_DOWNPAYMENT_AMOUNT = Number(
  process.env.WHOP_ACCELERATOR_DOWNPAYMENT_AMOUNT || "5000",
);

type CreateCheckoutConfigParams = {
  userId: string;
  // referenceNumber: string;
  paymentKey: PaymentPlan;
  customAmount?: number; // Optional custom amount in cents for tradeline purchases
};

/**
 * Creates a checkout configuration on Whop for a specific product using the SDK.
 *
 * @param {CreateCheckoutConfigParams} params - The parameters for creating the checkout link.
 * @returns {Promise<string>} The checkout configuration ID.
 */
export const createWhopCheckoutConfig = async ({
  userId,
  // referenceNumber,
  paymentKey,
  customAmount,
}: CreateCheckoutConfigParams): Promise<{
  checkoutId: string;
  url: string;
}> => {
  if (!whopSdk) {
    logError(new Error("Whop SDK is not initialized. Check API Key."));
    throw new Error("Server configuration error.");
  }

  if (!WHOP_COMPANY_ID) {
    logError(new Error("WHOP_COMPANY_ID is not set."));
    throw new Error("Server configuration error.");
  }

  const productIdToUse = paymentKey.includes("Tradeline")
    ? tradelineProductId
    : productId;

  if (!productIdToUse) {
    logError(new Error("WHOP_PRODUCT_ID is not set."));
    throw new Error("Server configuration error.");
  }

  try {
    // Skip reuse for tradeline purchases — amount varies per cart
    const isTradeline = paymentKey.includes("Tradeline");

    if (!isTradeline) {
      // Check if a checkout link already exists for this referenceNumber
      const existingCheckoutQuery = await firestoreAdmin()
        .collection(WHOP_CHECKOUTS_COLLECTION)
        .where("userId", "==", userId)
        .where("paymentKey", "==", paymentKey)
        .limit(1)
        .get();

      if (!existingCheckoutQuery.empty) {
        const existingCheckout = existingCheckoutQuery.docs[0].data();
        if (existingCheckout.checkoutId) {
          logInfo("Found existing checkout config for userId", {
            userId,
            checkoutId: existingCheckout.checkoutId,
            paymentKey,
          });
          return {
            checkoutId: existingCheckout.checkoutId,
            url: existingCheckout.url,
          };
        }
      }
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const fullPaymentAmount = customAmount
      ? customAmount
      : paymentKey === "AuditFull"
        ? AUDIT_FULL_AMOUNT
        : paymentKey === "IntelligenceFull"
          ? INTELLIGENCE_FULL_AMOUNT
          : paymentKey === "AcceleratorFull"
            ? ACCELERATOR_FULL_AMOUNT
            : paymentKey === "AcceleratorDownPayment"
              ? ACCELERATOR_DOWNPAYMENT_AMOUNT
              : paymentKey === "AuditDownPayment"
                ? AUDIT_DOWNPAYMENT_AMOUNT
                : paymentKey === "IntelligenceDownPayment"
                  ? INTELLIGENCE_DOWNPAYMENT_AMOUNT
                  : user.paymentAmount
                    ? Number(user.paymentAmount)
                    : Number(WHOP_FULL_PAYMENT_AMOUNT);

    const planDetails: CheckoutConfigurationCreateParams.CreateCheckoutSessionInputModePaymentWithPlan.Plan =
      {
        company_id: WHOP_COMPANY_ID,
        currency: "usd" as const,
        initial_price: fullPaymentAmount,
        plan_type: "one_time" as const,
        product_id: productIdToUse!,
        visibility: "hidden" as const,
      };

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: planDetails,
      metadata: {
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    });

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
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created", // Initial status
      paymentKey,
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);

    return { checkoutId, url: checkoutConfig.purchase_url };
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

export const createMembershipCheckoutConfig = async ({
  userId,
  planId,
  isAddon = false,
}: {
  userId: string;
  planId: "tier_starter" | "tier_pro" | "tier_executive";
  isAddon?: boolean;
}): Promise<{
  checkoutId: string;
  url: string;
}> => {
  if (!whopSdk) {
    throw new Error("Whop SDK is not initialized. Check API Key.");
  }

  if (
    !WHOP_COMPANY_ID ||
    !WHOP_PRICING_PLAN_STARTER_ID ||
    !WHOP_PRICING_PLAN_PRO_ID ||
    !WHOP_PRICING_PLAN_EXECUTIVE_ID
  ) {
    throw new Error("Payment Server configuration error.");
  }

  try {
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found");

    const feeSettings = await getFeeSettings();

    let amount = 0;
    let targetProductId = productId;

    if (planId === "tier_starter") {
      amount = feeSettings.tierStarterPrice;
      targetProductId = WHOP_PRICING_PLAN_STARTER_ID || productId;
    } else if (planId === "tier_pro") {
      amount = feeSettings.tierProPrice;
      targetProductId = WHOP_PRICING_PLAN_PRO_ID || productId;
    } else if (planId === "tier_executive") {
      amount = feeSettings.tierExecutivePrice;
      targetProductId = WHOP_PRICING_PLAN_EXECUTIVE_ID || productId;
    }

    if (!targetProductId) {
      throw new Error(
        "Server configuration error: Missing Product ID for the selected plan.",
      );
    }

    // We cast to any to bypass exact string literal checks for plan_type if 'subscription' is valid in reality but not the typings, or we can use "one_time"
    const planDetails: CheckoutConfigurationCreateParams.CreateCheckoutSessionInputModePaymentWithPlan.Plan =
      {
        company_id: WHOP_COMPANY_ID,
        currency: "usd" as const,
        // initial_price: amount, // Whop expects cents
        renewal_price: amount,
        billing_period: 30, // Whop expects this in DAYS (30 days = monthly)
        plan_type: "renewal" as const,
        product_id: targetProductId,
        visibility: "hidden" as const,
        // payment_method_configuration: {
        //   enabled: ["card", "apple_pay", "google_pay"],
        //   disabled: ["crypto", "splitit", "cashapp", "paypal"],
        //   include_platform_defaults: false,
        // },
      };

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: planDetails,
      metadata: {
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        planId,
        isAddon: isAddon ? "true" : "false",
      },
    });

    if (!checkoutConfig.id) {
      throw new Error("Failed to create checkout link for Membership.");
    }

    const checkoutId = checkoutConfig.id;

    const checkoutDoc = {
      userId,
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created",
      paymentKey: planId,
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);

    return { checkoutId, url: checkoutConfig.purchase_url };
  } catch (error: any) {
    logError(
      new Error(`createMembershipCheckoutConfig error: ${error.message}`),
    );
    throw error;
  }
};

export const createAddonCheckoutConfig = async ({
  userId,
  addonId,
}: {
  userId: string;
  addonId: "credit_module_pro";
}): Promise<{
  checkoutId: string;
  url: string;
}> => {
  if (!whopSdk) {
    throw new Error("Whop SDK is not initialized. Check API Key.");
  }

  if (!WHOP_COMPANY_ID || !WHOP_CREDIT_REPAIR_PRODUCT_ID) {
    throw new Error("Payment Server configuration error.");
  }

  try {
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found");

    const feeSettings = await getFeeSettings();

    let amount = 0;
    let targetProductId = productId;

    if (addonId === "credit_module_pro") {
      amount = feeSettings.creditModuleProAddonPrice;
      targetProductId = WHOP_CREDIT_REPAIR_PRODUCT_ID || productId;
    }

    if (!targetProductId) {
      throw new Error(
        "Server configuration error: Missing Product ID for the selected addon.",
      );
    }

    const planDetails: CheckoutConfigurationCreateParams.CreateCheckoutSessionInputModePaymentWithPlan.Plan =
      {
        company_id: WHOP_COMPANY_ID,
        currency: "usd" as const,
        renewal_price: amount,
        billing_period: 30, // Whop expects this in DAYS (30 days = monthly)
        plan_type: "renewal" as const,
        product_id: targetProductId,
        visibility: "hidden" as const,
      };

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: planDetails,
      metadata: {
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        planId: addonId,
        isAddon: "true",
      },
    });

    if (!checkoutConfig.id) {
      throw new Error("Failed to create checkout link for Addon.");
    }

    const checkoutId = checkoutConfig.id;

    const checkoutDoc = {
      userId,
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created",
      paymentKey: addonId,
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);

    return { checkoutId, url: checkoutConfig.purchase_url };
  } catch (error: any) {
    logError(new Error(`createAddonCheckoutConfig error: ${error.message}`));
    throw error;
  }
};
export const createCRSReportCheckoutConfig = async ({
  userId,
  paymentKey,
  feeAmount,
  metadata = {},
}: {
  userId: string;
  paymentKey: "CreditReportFee" | "BusinessCreditReportFee";
  feeAmount: number;
  metadata?: Record<string, any>;
}): Promise<{
  checkoutId: string;
  url: string;
}> => {
  if (!whopSdk) {
    throw new Error("Whop SDK is not initialized. Check API Key.");
  }

  if (!WHOP_COMPANY_ID || !generateCRSReportProductId) {
    throw new Error("Payment Server configuration error.");
  }

  try {
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found");

    const planDetails: CheckoutConfigurationCreateParams.CreateCheckoutSessionInputModePaymentWithPlan.Plan =
      {
        company_id: WHOP_COMPANY_ID,
        currency: "usd" as const,
        initial_price: feeAmount, // Whop expects cents
        plan_type: "one_time" as const,
        product_id: generateCRSReportProductId,
        visibility: "hidden" as const,
        payment_method_configuration: {
          enabled: ["card", "apple_pay", "google_pay"],
          disabled: ["crypto", "splitit", "cashapp", "paypal"],
          include_platform_defaults: false,
        },
      };

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: planDetails,
      metadata: {
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        ...metadata,
      },
    });

    if (!checkoutConfig.id) {
      throw new Error("Failed to create checkout link for CRS report.");
    }

    const checkoutId = checkoutConfig.id;

    // Save checkout details to Firestore
    const checkoutDoc = {
      userId,
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created",
      paymentKey,
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);

    return { checkoutId, url: checkoutConfig.purchase_url };
  } catch (error: any) {
    logError(
      new Error(`createCRSReportCheckoutConfig error: ${error.message}`),
    );
    throw error;
  }
};

export const createWalletCheckoutConfig = async ({
  userId,
  amount,
}: {
  userId: string;
  amount: number;
}): Promise<{
  checkoutId: string;
  url: string;
}> => {
  if (!whopSdk) {
    throw new Error("Whop SDK is not initialized. Check API Key.");
  }

  const WHOP_WALLET_PRODUCT_ID = process.env.WHOP_WALLET_PRODUCT_ID;
  if (!WHOP_COMPANY_ID || !WHOP_WALLET_PRODUCT_ID) {
    throw new Error("Payment Server configuration error.");
  }

  try {
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found");

    const planDetails: CheckoutConfigurationCreateParams.CreateCheckoutSessionInputModePaymentWithPlan.Plan =
      {
        company_id: WHOP_COMPANY_ID,
        currency: "usd" as const,
        initial_price: amount,
        plan_type: "one_time" as const,
        product_id: WHOP_WALLET_PRODUCT_ID,
        visibility: "hidden" as const,
        payment_method_configuration: {
          enabled: ["card", "apple_pay", "google_pay"],
          disabled: ["crypto", "splitit", "cashapp", "paypal"],
          include_platform_defaults: false,
        },
      };

    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: planDetails,
      metadata: {
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        paymentKey: "WalletTopUp",
      },
    });

    if (!checkoutConfig.id) {
      throw new Error("Failed to create checkout link for wallet top-up.");
    }

    const checkoutId = checkoutConfig.id;

    // Save checkout details to Firestore
    const checkoutDoc = {
      userId,
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created",
      paymentKey: "WalletTopUp",
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);

    return { checkoutId, url: checkoutConfig.purchase_url };
  } catch (error: any) {
    logError(new Error(`createWalletCheckoutConfig error: ${error.message}`));
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
    if (!payment.user?.email) {
      throw new Error("Payment user email not found.");
    }
    authUser = await auth.getUserByEmail(payment.user.email);
  } catch (error: any) {
    console.log("User not found.");

    const collectionRef = db.collection(USER_WHOP_PAYMENTS);
    await collectionRef.add({ ...payment, userId: null });

    return null;
  }

  if (!authUser) {
    console.log("User not found.");
    const collectionRef = db.collection(USER_WHOP_PAYMENTS);
    await collectionRef.add({ ...payment, userId: null });
    return null;
  }

  const userData = await getUserById(authUser.uid);
  if (!userData) {
    console.log("User not found.");
    const collectionRef = db.collection(USER_WHOP_PAYMENTS);
    await collectionRef.add({ ...payment, userId: null });
    return null;
  }

  const userId = authUser.uid;

  // Check if this is a wallet top-up payment
  const checkoutConfigId =
    (payment as any).checkout_configuration_id ||
    (payment as any).checkout_configuration?.id;
  const checkoutDetail = checkoutConfigId
    ? ((await getWhopCheckoutDetailByCheckoutId(checkoutConfigId)) as any)
    : null;
  const isWalletTopUp =
    checkoutDetail?.paymentKey === "WalletTopUp" ||
    (payment as any).product_id === process.env.WHOP_WALLET_PRODUCT_ID;

  if (isWalletTopUp) {
    try {
      await db.runTransaction(async (transaction) => {
        const txQuery = db
          .collection(USER_WALLET_TRANSACTIONS)
          .where("paymentId", "==", payment.id)
          .limit(1);
        const transactionQuery = await transaction.get(txQuery);

        if (!transactionQuery.empty) {
          logInfo(
            "Wallet top-up transaction already exists. Skipping credit.",
            { paymentId: payment.id },
          );
          return;
        }

        const creditAmount =
          checkoutDetail?.initialPrice ||
          ((payment as any).amount ? (payment as any).amount / 100 : 0);
        const walletRef = db.collection(USER_WALLET).doc(userId);
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists) {
          transaction.set(walletRef, {
            balance: creditAmount,
            userId,
            updatedAt: new Date().toISOString(),
          });
        } else {
          const currentBalance = walletDoc.data()?.balance || 0;
          transaction.update(walletRef, {
            balance: currentBalance + creditAmount,
            updatedAt: new Date().toISOString(),
          });
        }

        const transactionRef = db.collection(USER_WALLET_TRANSACTIONS).doc();
        transaction.set(transactionRef, {
          userId,
          amount: creditAmount,
          type: "credit",
          description: "Wallet Top-up via Whop",
          createdAt: new Date().toISOString(),
          paymentId: payment.id,
        });

        logInfo("Successfully credited wallet top-up", {
          userId,
          creditAmount,
          paymentId: payment.id,
        });
      });
    } catch (txError: any) {
      logError(
        new Error(
          `Failed to credit wallet during recordPaymentSucceeded transaction: ${txError.message}`,
        ),
      );
    }
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

export const getWhopCheckoutDetailByCheckoutId = async (checkoutId: string) => {
  try {
    const querySnapshot = await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .where("checkoutId", "==", checkoutId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      logInfo("No Whop checkout details found for checkoutId", { checkoutId });
      return null;
    }

    const checkoutDoc = querySnapshot.docs[0];
    const checkoutData = checkoutDoc.data();

    logInfo("Successfully retrieved Whop checkout details", {
      checkoutId,
      docId: checkoutDoc.id,
    });

    return { id: checkoutDoc.id, ...checkoutData };
  } catch (error: any) {
    logError(
      new Error(
        `getWhopCheckoutDetailByCheckoutId error: ${
          error.message || "Unknown error"
        }`,
      ),
      { checkoutId },
    );
    throw error;
  }
};

export const sendPaymentLink = async ({ userId }: { userId: string }) => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const paymentId = randomUUID();

    // Save payment request
    await firestoreAdmin()
      .collection(PAYMENT_REQUESTS_COLLECTION)
      .doc(paymentId)
      .set({
        userId,
        status: "pending",
        createdAt: new Date(),
      });

    const paymentPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/${paymentId}`;

    const bodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Payment - CEG United LLC</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0179FE; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Complete Your Payment</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${user.firstName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for choosing CEG UNITED! To complete your signup, please click the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentPageUrl}" style="display: inline-block; background-color: #0179FE; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Complete Payment
                </a>
              </div>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; word-break: break-all;">
                <a href="${paymentPageUrl}" style="color: #0179FE; text-decoration: none; font-size: 14px;">${paymentPageUrl}</a>
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                If you have any questions, please contact us at <a href="mailto:contact@cegunited.com" style="color: #0179FE; text-decoration: none;">contact@cegunited.com</a>. We’re here to help!
              </p>
              
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Thanks again, and welcome aboard!
              </p>
              <p style="margin: 10px 0 0; color: #333333; font-size: 16px; line-height: 1.6; font-weight: bold;">
                CEG UNITED LLC
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                CEG United LLC
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

    await sendTriggerEmail({
      to: user.email,
      message: {
        subject: "Complete Your Payment",
        html: bodyHTML,
      },
      job: EmailJobs.SEND_PAYMENT_LINK,
    });

    return { success: true };
  } catch (error: any) {
    logError(new Error(`Error sending payment link: ${error.message}`));
    throw error;
  }
};

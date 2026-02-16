"use server";

import { logError, logInfo } from "@/lib/logger";

import { getUserById } from "../user";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";
import {
  PAYMENT_REQUESTS_COLLECTION,
  USER_WHOP_PAYMENTS,
  WHOP_CHECKOUTS_COLLECTION,
} from "@/constant/collection-name";
import { whopSdk } from "@/lib/whop-sdk";
import { Payment } from "@whop/sdk/resources.js";
import { PaymentPlan } from "@/schema/payments";
import { sendMail } from "@/lib/nodemailer";
import { randomUUID } from "crypto";

const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID;
const productId = process.env.WHOP_PRODUCT_ID;
const WHOP_FULL_PAYMENT_AMOUNT =
  process.env.WHOP_FULL_PAYMENT_AMOUNT || "15000";
const WHOP_FINANCING_AMOUNT = process.env.WHOP_FINANCING_AMOUNT || "2500";

type CreateCheckoutConfigParams = {
  userId: string;
  // referenceNumber: string;
  paymentKey: PaymentPlan;
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
}: CreateCheckoutConfigParams): Promise<{
  checkoutId: string;
  url: string;
}> => {
  // console.log("createWhopCheckoutConfig called with:", {
  //   userId,
  //   referenceNumber,
  //   paymentKey,
  // });

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

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const planDetails = {
      company_id: WHOP_COMPANY_ID,
      currency: "usd" as const,
      initial_price:
        paymentKey === "FullPayment"
          ? Number(WHOP_FULL_PAYMENT_AMOUNT)
          : Number(WHOP_FINANCING_AMOUNT),
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
      // referenceNumber,
      checkoutId,
      url: checkoutConfig.purchase_url,
      createdAt: new Date(),
      initialPrice: planDetails.initial_price,
      // currency: planDetails.currency,
      planType: planDetails.plan_type,
      productId: planDetails.product_id,
      status: "created", // Initial status
      paymentKey,
      ...checkoutConfig,
    };

    await firestoreAdmin()
      .collection(WHOP_CHECKOUTS_COLLECTION)
      .add(checkoutDoc);
    // logInfo(
    //   "Successfully saved whop checkout config to firestore",
    //   checkoutDoc,
    // );

    // logInfo("createWhopCheckoutConfig (SDK) success", { checkoutId });
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

export const sendPaymentLink = async ({
  userId,
  paymentKey = "FullPayment",
}: {
  userId: string;
  paymentKey?: PaymentPlan;
}) => {
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

    await sendMail({
      emailTo: user.email,
      subject: "Complete Your Payment",
      bodyHTML,
    });

    return { success: true };
  } catch (error: any) {
    logError(new Error(`Error sending payment link: ${error.message}`));
    throw error;
  }
};

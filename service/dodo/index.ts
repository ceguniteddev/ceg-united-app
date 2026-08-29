"use server";

import type { Payment } from "dodopayments/resources/payments";
import type { Subscription } from "dodopayments/resources/subscriptions";
import { randomUUID } from "crypto";

import {
  DODO_CHECKOUTS_COLLECTION,
  DODO_PAYMENT_REQUESTS_COLLECTION,
  PSF_INVOICES_COLLECTION,
  USER_DODO_PAYMENTS,
  USER_WALLET,
  USER_WALLET_TRANSACTIONS,
  COURSE,
  USER_COURSE_ENROLLMENT,
  DODO_MEMBERSHIP_RECONCILIATIONS,
  USER_COLLECTION,
  MAIL_COLLECTION,
} from "@/constant/collection-name";
import { dodoClient } from "@/lib/dodo-sdk";
import { resolveDodoReturnUrl } from "@/lib/dodo-env";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import type { PaymentPlan } from "@/schema/payments";
import { EmailJobs } from "@/schema/trigger-email";
import { getFeeSettings } from "@/service/fee-settings";
import { synchronizeDodoAddon } from "@/service/addons";
import { synchronizeDodoMembership } from "@/service/membership";
import { sendTriggerEmail } from "@/service/trigger-email";
import { getUserById } from "@/service/user";
import { getCoursePricing } from "@/lib/course-pricing";
import membershipCache from "@/lib/membership-cache";

type CheckoutResult = { checkoutId: string; url: string };
type Metadata = Record<string, string>;

const amount = (name: string, fallback: number) =>
  Number(process.env[name] || fallback);

const productForPayment = (paymentKey: PaymentPlan) => {
  if (paymentKey.includes("Tradeline"))
    return process.env.DODO_PRODUCT_TRADELINE_ID;
  if (
    paymentKey.includes("Audit") ||
    paymentKey.includes("Intelligence") ||
    paymentKey.includes("Accelerator")
  )
    return process.env.DODO_PRODUCT_BUSINESS_SERVICES_ID;
  if (paymentKey.includes("CreditReport"))
    return process.env.DODO_PRODUCT_CRS_REPORT_ID;
  if (paymentKey === "WalletTopUp") return process.env.DODO_PRODUCT_WALLET_ID;
  if (paymentKey === "CoursePurchase")
    return (
      process.env.DODO_PRODUCT_COURSE_ID ||
      process.env.DODO_PRODUCT_BUSINESS_SERVICES_ID
    );
  return undefined;
};

const amountForPayment = (paymentKey: PaymentPlan, customAmount?: number) => {
  if (customAmount != null) return customAmount;
  const amounts: Partial<Record<PaymentPlan, number>> = {
    AuditFull: amount("DODO_AUDIT_FULL_AMOUNT", 200000),
    IntelligenceFull: amount("DODO_INTELLIGENCE_FULL_AMOUNT", 500000),
    AcceleratorFull: amount("DODO_ACCELERATOR_FULL_AMOUNT", 1500000),
    AuditDownPayment: amount("DODO_AUDIT_DOWNPAYMENT_AMOUNT", 75000),
    IntelligenceDownPayment: amount(
      "DODO_INTELLIGENCE_DOWNPAYMENT_AMOUNT",
      100000,
    ),
    AcceleratorDownPayment: amount(
      "DODO_ACCELERATOR_DOWNPAYMENT_AMOUNT",
      500000,
    ),
  };
  const configuredAmount = amounts[paymentKey];
  if (configuredAmount == null) {
    throw new Error(`Missing Dodo amount for ${paymentKey}.`);
  }
  return configuredAmount;
};

const requireProduct = (productId: string | undefined, label: string) => {
  if (!productId) throw new Error(`Missing Dodo product ID for ${label}.`);
  return productId;
};

const getCheckoutUser = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  return user;
};

const createSession = async ({
  userId,
  productId,
  paymentKey,
  amountInCents,
  metadata = {},
  onDemand,
  reuseCustomer = false,
  returnUrl,
}: {
  userId: string;
  productId: string;
  paymentKey: string;
  amountInCents: number;
  metadata?: Metadata;
  onDemand?: boolean;
  reuseCustomer?: boolean;
  returnUrl?: string;
}): Promise<CheckoutResult> => {
  const user = await getCheckoutUser(userId);
  const existingCustomerId = reuseCustomer
    ? await getDodoCustomerIdByUserId(userId)
    : null;
  const session = await dodoClient.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: Math.round(amountInCents),
      },
    ],
    customer: existingCustomerId
      ? { customer_id: existingCustomerId }
      : {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
        },
    metadata: { userId, paymentKey, ...metadata },
    return_url: returnUrl ?? resolveDodoReturnUrl(),
    allowed_payment_method_types: [
      "credit",
      "debit",
      "apple_pay",
      "google_pay",
    ],
    customization: { theme: "system" },
    feature_flags: {
      redirect_immediately: true,
    },
    ...(onDemand
      ? {
          subscription_data: {
            on_demand: {
              mandate_only: false,
              product_currency: "USD",
              product_price: Math.round(amountInCents),
            },
          },
        }
      : {}),
  });

  if (!session.session_id || !session.checkout_url) {
    throw new Error(
      "Dodo Payments did not return a complete checkout session.",
    );
  }

  await firestoreAdmin()
    .collection(DODO_CHECKOUTS_COLLECTION)
    .add({
      userId,
      checkoutId: session.session_id,
      url: session.checkout_url,
      createdAt: new Date(),
      amount: amountInCents,
      productId,
      status: "created",
      paymentKey,
      metadata: { userId, paymentKey, ...metadata },
      provider: "dodo",
      ...session,
    });

  return { checkoutId: session.session_id, url: session.checkout_url };
};

export const createDodoCheckoutConfig = async ({
  userId,
  paymentKey,
  customAmount,
  returnUrl,
}: {
  userId: string;
  paymentKey: PaymentPlan;
  customAmount?: number;
  returnUrl?: string;
}): Promise<CheckoutResult> => {
  const isVariable = paymentKey.includes("Tradeline");
  if (!isVariable) {
    const existing = await firestoreAdmin()
      .collection(DODO_CHECKOUTS_COLLECTION)
      .where("userId", "==", userId)
      .where("paymentKey", "==", paymentKey)
      .limit(1)
      .get();
    if (!existing.empty) {
      const data = existing.docs[0].data();
      if (data.checkoutId && data.url) {
        return { checkoutId: data.checkoutId, url: data.url };
      }
    }
  }

  return createSession({
    userId,
    productId: requireProduct(productForPayment(paymentKey), paymentKey),
    paymentKey,
    amountInCents: amountForPayment(paymentKey, customAmount),
    returnUrl,
  });
};

const membershipProduct = (planId: string) => {
  const products: Record<string, string | undefined> = {
    tier_starter: process.env.DODO_PRODUCT_MEMBERSHIP_STARTER_ID,
    tier_pro: process.env.DODO_PRODUCT_MEMBERSHIP_PRO_ID,
    tier_executive: process.env.DODO_PRODUCT_MEMBERSHIP_EXECUTIVE_ID,
  };
  return products[planId];
};

const membershipTierForProduct = (productId?: string) => {
  if (!productId) return undefined;
  return (["tier_starter", "tier_pro", "tier_executive"] as const).find(
    (tier) => membershipProduct(tier) === productId,
  );
};

const membershipReturnUrl = (returnUrl?: string) => {
  const url = new URL(returnUrl ?? resolveDodoReturnUrl());
  url.searchParams.set("membershipCheckout", "1");
  return url.toString();
};

export const createMembershipCheckoutConfig = async ({
  userId,
  planId,
  selectedAddonIds = [],
  isAddon = false,
  returnUrl,
}: {
  userId: string;
  planId: "tier_starter" | "tier_pro" | "tier_executive";
  selectedAddonIds?: string[];
  isAddon?: boolean;
  returnUrl?: string;
}): Promise<CheckoutResult> => {
  const fees = await getFeeSettings();
  const prices = {
    tier_starter: fees.tierStarterPrice,
    tier_pro: fees.tierProPrice,
    tier_executive: fees.tierExecutivePrice,
  };
  const priceInDollars =
    prices[planId] +
    (selectedAddonIds.includes("credit_module_pro")
      ? (fees.creditModuleProAddonPrice ?? 197)
      : 0);
  const priceInCents = Math.round(priceInDollars * 100);

  return createSession({
    userId,
    productId: requireProduct(membershipProduct(planId), planId),
    paymentKey: planId,
    amountInCents: priceInCents,
    reuseCustomer: true,
    returnUrl: membershipReturnUrl(returnUrl),
    metadata: {
      planId,
      membershipAmount: String(prices[planId]),
      isAddon: String(isAddon),
      selectedAddonIds: JSON.stringify(selectedAddonIds),
    },
  });
};

export const createAddonCheckoutConfig = async ({
  userId,
  addonId,
  returnUrl,
}: {
  userId: string;
  addonId: "credit_module_pro";
  returnUrl?: string;
}): Promise<CheckoutResult> => {
  const fees = await getFeeSettings();
  return createSession({
    userId,
    productId: requireProduct(
      process.env.DODO_PRODUCT_CREDIT_MODULE_PRO_ID,
      addonId,
    ),
    paymentKey: addonId,
    amountInCents: Math.round(fees.creditModuleProAddonPrice * 100),
    reuseCustomer: true,
    returnUrl,
    metadata: {
      planId: addonId,
      isAddon: "true",
      addonAmount: String(fees.creditModuleProAddonPrice),
    },
  });
};

export const createCRSReportCheckoutConfig = async ({
  userId,
  paymentKey,
  feeAmount,
  metadata = {},
  returnUrl,
}: {
  userId: string;
  paymentKey: "CreditReportFee" | "BusinessCreditReportFee";
  feeAmount: number;
  metadata?: Metadata;
  returnUrl?: string;
}) =>
  createSession({
    userId,
    productId: requireProduct(
      process.env.DODO_PRODUCT_CRS_REPORT_ID,
      "CRS report",
    ),
    paymentKey,
    amountInCents: feeAmount,
    metadata,
    returnUrl,
  });

export const createWalletCheckoutConfig = async ({
  userId,
  amount: amountInCents,
  returnUrl,
}: {
  userId: string;
  amount: number;
  returnUrl?: string;
}) =>
  createSession({
    userId,
    productId: requireProduct(process.env.DODO_PRODUCT_WALLET_ID, "wallet"),
    paymentKey: "WalletTopUp",
    amountInCents,
    returnUrl,
  });

export const createPsfInvoiceCheckoutConfig = async ({
  userId,
  invoiceId,
  feeAmount,
  returnUrl,
}: {
  userId: string;
  invoiceId: string;
  feeAmount: number;
  returnUrl?: string;
}) =>
  createSession({
    userId,
    productId: requireProduct(process.env.DODO_PRODUCT_PSF_ID, "PSF invoice"),
    paymentKey: "PSF_INVOICE",
    amountInCents: feeAmount,
    returnUrl,
    metadata: { invoiceId, type: "PSF_INVOICE", planId: "PSF_INVOICE" },
  });

export const createCourseCheckoutConfig = async ({
  userId,
  courseId,
  returnUrl,
}: {
  userId: string;
  courseId: string;
  returnUrl?: string;
}) => {
  const db = firestoreAdmin();
  const courseDoc = await db.collection(COURSE).doc(courseId).get();
  if (!courseDoc.exists) {
    throw new Error("Course not found");
  }
  const courseData = courseDoc.data();
  if (!courseData?.isPublished) {
    throw new Error("Course is not available for purchase");
  }

  if (courseData.luminoCheckoutUrl) {
    return {
      checkoutId: `lumino_${courseId}`,
      url: courseData.luminoCheckoutUrl,
    };
  }

  const pricing = getCoursePricing(courseData);
  if (pricing.isFree) {
    throw new Error("Course is free and does not require checkout");
  }

  const amountInCents = Math.round(pricing.effectivePrice * 100);

  const productId =
    courseData.dodoProductId ||
    process.env.DODO_PRODUCT_COURSE_ID ||
    process.env.DODO_PRODUCT_BUSINESS_SERVICES_ID;

  return createSession({
    userId,
    productId: requireProduct(productId, "course"),
    paymentKey: "CoursePurchase",
    amountInCents,
    returnUrl,
    metadata: {
      courseId,
      courseTitle: courseData.title || "",
      type: "COURSE_PURCHASE",
    },
  });
};

export const chargeMembership = async ({
  subscriptionId,
  amountInCents,
  metadata = {},
}: {
  subscriptionId: string;
  amountInCents: number;
  metadata?: Metadata;
}) =>
  dodoClient.subscriptions.charge(subscriptionId, {
    product_price: Math.round(amountInCents),
    product_currency: "USD",
    metadata,
  });

export const getDodoCheckoutDetailByCheckoutId = async (checkoutId: string) => {
  const result = await firestoreAdmin()
    .collection(DODO_CHECKOUTS_COLLECTION)
    .where("checkoutId", "==", checkoutId)
    .limit(1)
    .get();
  if (result.empty) return null;
  return { id: result.docs[0].id, ...result.docs[0].data() };
};

export const recordPaymentSucceeded = async ({
  payment,
}: {
  payment: Payment;
}) => {
  const db = firestoreAdmin();
  const checkout = payment.checkout_session_id
    ? await getDodoCheckoutDetailByCheckoutId(payment.checkout_session_id)
    : null;
  const checkoutData = (checkout || {}) as Record<string, any>;
  const metadata = {
    ...((checkoutData.metadata || {}) as Record<string, string>),
    ...((payment.metadata || {}) as Record<string, string>),
  };
  const userId = metadata.userId || checkoutData.userId || null;
  const paymentKey = metadata.paymentKey || checkoutData.paymentKey;

  logInfo("Recording Dodo payment succeeded", {
    paymentId: payment.payment_id,
    userId,
    paymentKey,
  });

  if (userId && paymentKey === "WalletTopUp") {
    await db.runTransaction(async (transaction) => {
      const duplicateQuery = db
        .collection(USER_WALLET_TRANSACTIONS)
        .where("paymentId", "==", payment.payment_id)
        .limit(1);
      const duplicate = await transaction.get(duplicateQuery);
      if (!duplicate.empty) return;

      const creditAmount = payment.total_amount / 100;
      const walletRef = db.collection(USER_WALLET).doc(userId);
      const wallet = await transaction.get(walletRef);
      if (wallet.exists) {
        transaction.update(walletRef, {
          balance: (wallet.data()?.balance || 0) + creditAmount,
          updatedAt: new Date().toISOString(),
        });
      } else {
        transaction.set(walletRef, {
          balance: creditAmount,
          userId,
          updatedAt: new Date().toISOString(),
        });
      }
      transaction.set(db.collection(USER_WALLET_TRANSACTIONS).doc(), {
        userId,
        amount: creditAmount,
        type: "credit",
        description: "Wallet Top-up via Dodo Payments",
        createdAt: new Date().toISOString(),
        paymentId: payment.payment_id,
      });
    });
  }

  const invoiceId =
    metadata.invoiceId || (checkout as any)?.metadata?.invoiceId;
  if (paymentKey === "PSF_INVOICE" && invoiceId) {
    await db.collection(PSF_INVOICES_COLLECTION).doc(invoiceId).set(
      {
        status: "paid",
        dodoPaymentId: payment.payment_id,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  if (paymentKey === "CoursePurchase" || metadata.type === "COURSE_PURCHASE") {
    const courseId = metadata.courseId;
    if (userId && courseId) {
      await db.runTransaction(async (transaction) => {
        const enrollmentQuery = db
          .collection(USER_COURSE_ENROLLMENT)
          .where("userId", "==", userId)
          .where("courseId", "==", courseId)
          .limit(1);
        const existing = await transaction.get(enrollmentQuery);
        if (existing.empty) {
          const newEnrollmentRef = db.collection(USER_COURSE_ENROLLMENT).doc();
          transaction.set(newEnrollmentRef, {
            userId,
            courseId,
            enrolledAt: new Date(),
            lastAccessedAt: new Date(),
            progressPercentage: 0,
            dodoPaymentId: payment.payment_id,
            amountPaid: payment.total_amount / 100,
            status: "active",
          });

          const courseRef = db.collection(COURSE).doc(courseId);
          const courseDoc = await transaction.get(courseRef);
          if (courseDoc.exists) {
            const currentCount = courseDoc.data()?.enrolledStudentsCount || 0;
            transaction.update(courseRef, {
              enrolledStudentsCount: currentCount + 1,
            });
          }
        }
      });
    }
  }

  await db
    .collection(USER_DODO_PAYMENTS)
    .doc(payment.payment_id)
    .set({ ...payment, userId, provider: "dodo" }, { merge: true });
};

export const recordSubscriptionActive = async ({
  subscription,
}: {
  subscription: Subscription;
}) => {
  const metadata = (subscription.metadata || {}) as Record<string, string>;
  let userId = metadata.userId;

  if (!userId && subscription.customer?.customer_id) {
    const paymentSnapshot = await firestoreAdmin()
      .collection(USER_DODO_PAYMENTS)
      .where("customer.customer_id", "==", subscription.customer.customer_id)
      .limit(20)
      .get();
    userId = paymentSnapshot.docs[0]?.data()?.userId;
  }

  const isAddon =
    metadata.isAddon === "true" ||
    metadata.planId === "credit_module_pro" ||
    (Boolean(process.env.DODO_PRODUCT_CREDIT_MODULE_PRO_ID) &&
      subscription.product_id ===
        process.env.DODO_PRODUCT_CREDIT_MODULE_PRO_ID);

  if (isAddon) {
    if (!userId) {
      logError(
        new Error(
          `Unable to activate addon subscription ${subscription.subscription_id}: missing userId`,
        ),
      );
      return;
    }
    const fees = await getFeeSettings();
    const addonId =
      (metadata.planId as "credit_module_pro") || "credit_module_pro";
    await synchronizeDodoAddon({
      userId,
      addonId,
      providerStatus: subscription.status,
      subscriptionId: subscription.subscription_id,
      customerId: subscription.customer?.customer_id,
      productId: subscription.product_id,
      amount:
        Number(metadata.addonAmount) ||
        fees.creditModuleProAddonPrice ||
        subscription.recurring_pre_tax_amount / 100 ||
        197,
      previousBillingDate: subscription.previous_billing_date,
      nextBillingDate: subscription.next_billing_date,
      expiresAt: subscription.expires_at,
      cancelAtNextBillingDate: subscription.cancel_at_next_billing_date,
      eventCreatedAt: subscription.created_at,
    });
    return;
  }

  const tier =
    metadata.planId || membershipTierForProduct(subscription.product_id);

  if (!userId || !tier) {
    logError(
      new Error(
        `Unable to activate subscription ${subscription.subscription_id}: missing ${!userId ? "userId" : "membership tier"}`,
      ),
    );
    return;
  }
  await synchronizeDodoMembership({
    userId,
    tier: tier as "tier_starter" | "tier_pro" | "tier_executive",
    providerStatus: subscription.status,
    subscriptionId: subscription.subscription_id,
    customerId: subscription.customer?.customer_id,
    productId: subscription.product_id,
    amount:
      Number(metadata.membershipAmount) ||
      subscription.recurring_pre_tax_amount / 100,
    previousBillingDate: subscription.previous_billing_date,
    nextBillingDate: subscription.next_billing_date,
    expiresAt: subscription.expires_at,
    cancelAtNextBillingDate: subscription.cancel_at_next_billing_date,
    eventCreatedAt: subscription.created_at,
  });
};

const sendSubscriptionAccessEndedNotice = async ({
  userId,
  subscriptionId,
  subject,
  message,
  recordPath,
  noticeKey,
}: {
  userId: string;
  subscriptionId: string;
  subject: string;
  message: string;
  recordPath: string;
  noticeKey: string;
}) => {
  const record = await firestoreAdmin().doc(recordPath).get();
  if (record?.exists && record.data()?.finalNoticeSentAt) return;
  const user = await getUserById(userId).catch(() => null);
  if (!user?.email) return;
  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/membership`;
  const mailRef = firestoreAdmin()
    .collection(MAIL_COLLECTION)
    .doc(`subscription-ended-${noticeKey}-${subscriptionId}`);
  await mailRef
    .create({
      to: user.email,
      from: "CEG United LLC <noreply@cegunited.com>",
      job: EmailJobs.MEMBERSHIP_ACCESS_ENDED,
      message: {
        subject,
        html: `<p>Hi ${user.firstName || "there"},</p><p>${message}</p><p><a href="${settingsUrl}">Manage billing</a> to restore access.</p>`,
      },
      createdAt: new Date(),
    })
    .catch((error: any) => {
      if (error?.code !== 6 && error?.code !== "already-exists") throw error;
    });
  await firestoreAdmin()
    .doc(recordPath)
    .set({ finalNoticeSentAt: new Date() }, { merge: true });
};

export const recordSubscriptionLifecycle = async ({
  subscription,
  eventType,
  eventCreatedAt,
  webhookEventId,
  userIdOverride,
}: {
  subscription: Subscription;
  eventType: string;
  eventCreatedAt?: string | null;
  webhookEventId?: string;
  userIdOverride?: string;
}) => {
  const metadata = (subscription.metadata || {}) as Record<string, string>;
  logInfo("Synchronizing Dodo subscription lifecycle", {
    eventType,
    subscriptionId: subscription.subscription_id,
    providerStatus: subscription.status,
  });
  let userId = userIdOverride || metadata.userId;

  if (!userId) {
    const bySubscription = await firestoreAdmin()
      .collectionGroup("membership")
      .where("subscriptionId", "==", subscription.subscription_id)
      .limit(1)
      .get();
    if (!bySubscription.empty) {
      const path = bySubscription.docs[0].ref.path.split("/");
      userId = path[path.length - 3];
    }
  }

  if (!userId) {
    const byAddonSubscription = await firestoreAdmin()
      .collectionGroup("addons")
      .where("subscriptionId", "==", subscription.subscription_id)
      .limit(1)
      .get();
    if (!byAddonSubscription.empty) {
      const path = byAddonSubscription.docs[0].ref.path.split("/");
      userId = path[path.length - 3];
    }
  }

  if (!userId && subscription.customer?.customer_id) {
    const paymentSnapshot = await firestoreAdmin()
      .collection(USER_DODO_PAYMENTS)
      .where("customer.customer_id", "==", subscription.customer.customer_id)
      .limit(20)
      .get();
    userId = paymentSnapshot.docs[0]?.data()?.userId;
  }

  const isAddon =
    metadata.isAddon === "true" ||
    metadata.planId === "credit_module_pro" ||
    (Boolean(process.env.DODO_PRODUCT_CREDIT_MODULE_PRO_ID) &&
      subscription.product_id ===
        process.env.DODO_PRODUCT_CREDIT_MODULE_PRO_ID);
  if (isAddon) {
    if (!userId) {
      logError(
        new Error(
          `Unable to synchronize addon subscription ${subscription.subscription_id}: missing userId`,
        ),
      );
      return;
    }
    const fees = await getFeeSettings();
    const addonId = "credit_module_pro" as const;
    await synchronizeDodoAddon({
      userId,
      addonId,
      providerStatus: subscription.status,
      subscriptionId: subscription.subscription_id,
      customerId: subscription.customer?.customer_id,
      productId: subscription.product_id,
      amount:
        Number(metadata.addonAmount) ||
        fees.creditModuleProAddonPrice ||
        subscription.recurring_pre_tax_amount / 100 ||
        197,
      previousBillingDate: subscription.previous_billing_date,
      nextBillingDate: subscription.next_billing_date,
      expiresAt: subscription.expires_at,
      cancelAtNextBillingDate: subscription.cancel_at_next_billing_date,
      eventCreatedAt: eventCreatedAt || subscription.created_at,
      lastWebhookEventId: webhookEventId,
    });

    const accessEnded =
      subscription.status === "failed" ||
      subscription.status === "expired" ||
      (subscription.status === "cancelled" &&
        !subscription.cancel_at_next_billing_date);
    if (accessEnded) {
      await sendSubscriptionAccessEndedNotice({
        userId,
        subscriptionId: subscription.subscription_id,
        subject: "Your Credit Repair Addon is now inactive",
        message:
          "Your paid Credit Repair Addon access has ended. Manage billing to restore access.",
        recordPath: `${USER_COLLECTION}/${userId}/addons/${addonId}`,
        noticeKey: addonId,
      });
    }
    return;
  }

  const tier =
    metadata.planId || membershipTierForProduct(subscription.product_id);
  if (!userId || !tier) {
    logError(
      new Error(
        `Unable to synchronize subscription ${subscription.subscription_id}: missing ${!userId ? "userId" : "membership tier"}`,
      ),
    );
    return;
  }

  await synchronizeDodoMembership({
    userId,
    tier: tier as "tier_starter" | "tier_pro" | "tier_executive",
    providerStatus: subscription.status,
    subscriptionId: subscription.subscription_id,
    customerId: subscription.customer?.customer_id,
    productId: subscription.product_id,
    amount:
      Number(metadata.membershipAmount) ||
      subscription.recurring_pre_tax_amount / 100,
    previousBillingDate: subscription.previous_billing_date,
    nextBillingDate: subscription.next_billing_date,
    expiresAt: subscription.expires_at,
    cancelAtNextBillingDate: subscription.cancel_at_next_billing_date,
    eventCreatedAt: eventCreatedAt || subscription.created_at,
    lastWebhookEventId: webhookEventId,
  });

  let selectedAddonIds: string[] = [];
  try {
    selectedAddonIds = JSON.parse(metadata.selectedAddonIds || "[]");
  } catch (error) {
    logError(
      new Error(
        `Invalid selectedAddonIds for subscription ${subscription.subscription_id}: ${error}`,
      ),
    );
  }
  if (selectedAddonIds.includes("credit_module_pro")) {
    const fees = await getFeeSettings();
    await synchronizeDodoAddon({
      userId,
      addonId: "credit_module_pro",
      providerStatus: subscription.status,
      subscriptionId: subscription.subscription_id,
      customerId: subscription.customer?.customer_id,
      productId: subscription.product_id,
      amount: fees.creditModuleProAddonPrice ?? 197,
      previousBillingDate: subscription.previous_billing_date,
      nextBillingDate: subscription.next_billing_date,
      expiresAt: subscription.expires_at,
      cancelAtNextBillingDate: subscription.cancel_at_next_billing_date,
      eventCreatedAt: eventCreatedAt || subscription.created_at,
      lastWebhookEventId: webhookEventId,
    });
  }

  const accessEnded =
    subscription.status === "failed" ||
    subscription.status === "expired" ||
    (subscription.status === "cancelled" &&
      !subscription.cancel_at_next_billing_date);
  if (accessEnded) {
    await sendSubscriptionAccessEndedNotice({
      userId,
      subscriptionId: subscription.subscription_id,
      subject: "Your CEG Brain plan is now Free",
      message:
        "Your paid membership access has ended and your effective CEG Brain plan is now Free.",
      recordPath: `${USER_COLLECTION}/${userId}/membership/current`,
      noticeKey: "membership",
    });
    if (selectedAddonIds.includes("credit_module_pro")) {
      await sendSubscriptionAccessEndedNotice({
        userId,
        subscriptionId: subscription.subscription_id,
        subject: "Your Credit Repair Addon is now inactive",
        message: "Your paid Credit Repair Addon access has ended.",
        recordPath: `${USER_COLLECTION}/${userId}/addons/credit_module_pro`,
        noticeKey: "credit_module_pro",
      });
    }
  }
};

export const getDodoPayments = async () => {
  const snapshot = await firestoreAdmin()
    .collection(USER_DODO_PAYMENTS)
    .orderBy("created_at", "desc")
    .get();
  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const user = data.userId
        ? await getUserById(data.userId).catch(() => null)
        : null;
      return {
        docId: doc.id,
        ...data,
        mappedEmail: user?.email || null,
        mappedFirstName: user?.firstName || null,
        mappedLastName: user?.lastName || null,
      };
    }),
  );
};

export const getDodoCustomerIdByUserId = async (userId: string) => {
  const currentMembership = await firestoreAdmin()
    .collection(`${USER_COLLECTION}/${userId}/membership`)
    .doc("current")
    .get();
  if (currentMembership?.exists) {
    const customerId = currentMembership.data()?.customerId;
    if (customerId) return customerId as string;
  }
  const addon = await firestoreAdmin()
    .collection(`${USER_COLLECTION}/${userId}/addons`)
    .doc("credit_module_pro")
    .get();
  if (addon?.exists) {
    const customerId = addon.data()?.customerId;
    if (customerId) return customerId as string;
  }
  const snapshot = await firestoreAdmin()
    .collection(USER_DODO_PAYMENTS)
    .where("userId", "==", userId)
    .orderBy("created_at", "desc")
    .limit(20)
    .get();
  for (const doc of snapshot.docs) {
    const customerId = doc.data().customer?.customer_id;
    if (customerId) return customerId as string;
  }
  return null;
};

export const reconcileLegacyMemberships = async ({
  apply = false,
}: {
  apply?: boolean;
} = {}) => {
  const db = firestoreAdmin();
  const [membershipSnapshot, addonSnapshot] = await Promise.all([
    db.collectionGroup("membership").get(),
    db.collectionGroup("addons").get(),
  ]);
  const runId = randomUUID();
  const results: Array<Record<string, unknown>> = [];

  for (const membership of [
    ...membershipSnapshot.docs,
    ...addonSnapshot.docs,
  ]) {
    const isAddon = membership.ref.path.includes("/addons/");
    if (!isAddon && membership.id !== "current") continue;
    const data = membership.data();
    const path = membership.ref.path.split("/");
    const userId = path[path.length - 3];
    const candidateId =
      data.subscriptionId ||
      (String(data.checkoutId || "").startsWith("sub_")
        ? data.checkoutId
        : null);

    if (!candidateId) {
      results.push({
        userId,
        entity: isAddon ? membership.id : "membership",
        status: "legacy_unmapped",
        applied: false,
      });
      if (apply) {
        await membership.ref.set(
          { legacyBillingModel: true, reconciliationRunId: runId },
          { merge: true },
        );
      }
      continue;
    }

    try {
      const subscription = await dodoClient.subscriptions.retrieve(candidateId);
      if (subscription.on_demand) {
        results.push({
          userId,
          entity: isAddon ? membership.id : "membership",
          subscriptionId: candidateId,
          status: "legacy_on_demand",
          applied: apply,
        });
        if (apply) {
          await membership.ref.set(
            {
              subscriptionId: candidateId,
              customerId: subscription.customer?.customer_id || null,
              provider: "dodo",
              providerStatus: subscription.status,
              legacyBillingModel: true,
              reconciliationRunId: runId,
              updatedAt: new Date(),
            },
            { merge: true },
          );
        }
        continue;
      }

      results.push({
        userId,
        entity: isAddon ? membership.id : "membership",
        subscriptionId: candidateId,
        status: "recurring",
        applied: apply,
      });
      if (apply) {
        await recordSubscriptionLifecycle({
          subscription,
          eventType: "reconciliation",
          eventCreatedAt: new Date().toISOString(),
          webhookEventId: `reconciliation:${runId}`,
          userIdOverride: userId,
        });
      }
    } catch (error: any) {
      results.push({
        userId,
        entity: isAddon ? membership.id : "membership",
        subscriptionId: candidateId,
        status: "provider_lookup_failed",
        error: error.message,
        applied: false,
      });
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, item) => {
    const status = String(item.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  await db.collection(DODO_MEMBERSHIP_RECONCILIATIONS).doc(runId).set({
    runId,
    apply,
    summary,
    results,
    createdAt: new Date(),
  });
  if (apply) {
    for (const result of results) {
      if (result.userId) membershipCache.invalidate(String(result.userId));
    }
  }
  return { runId, apply, summary, results };
};

export const mapDodoPaymentToUser = async ({
  docId,
  userId,
}: {
  docId: string;
  userId: string;
}) => {
  const user = await getCheckoutUser(userId);
  await firestoreAdmin().collection(USER_DODO_PAYMENTS).doc(docId).update({
    userId,
    mappedEmail: user.email,
    mappedFirstName: user.firstName,
    mappedLastName: user.lastName,
  });
  return { success: true };
};

export const unmapDodoPayment = async ({ docId }: { docId: string }) => {
  await firestoreAdmin().collection(USER_DODO_PAYMENTS).doc(docId).update({
    userId: null,
    mappedEmail: null,
    mappedFirstName: null,
    mappedLastName: null,
  });
  return { success: true };
};

export const sendPaymentLink = async ({ userId }: { userId: string }) => {
  try {
    const user = await getCheckoutUser(userId);
    const paymentId = randomUUID();
    await firestoreAdmin()
      .collection(DODO_PAYMENT_REQUESTS_COLLECTION)
      .doc(paymentId)
      .set({ userId, status: "pending", createdAt: new Date() });
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/payment/${paymentId}`;
    await sendTriggerEmail({
      to: user.email,
      message: {
        subject: "Complete Your Payment",
        html: `<p>Hi ${user.firstName},</p><p><a href="${url}">Complete Payment</a></p>`,
      },
      job: EmailJobs.SEND_PAYMENT_LINK,
    });
    logInfo("Sent Dodo payment link", { userId, paymentId });
    return { success: true };
  } catch (error: any) {
    logError(new Error(`Error sending Dodo payment link: ${error.message}`));
    throw error;
  }
};

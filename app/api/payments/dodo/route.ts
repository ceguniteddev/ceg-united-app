import type { Payment } from "dodopayments/resources/payments";
import type { Subscription } from "dodopayments/resources/subscriptions";

import { DODO_WEBHOOK_EVENTS } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { Webhooks } from "@/lib/dodo-nextjs";
import {
  recordPaymentSucceeded,
  recordSubscriptionActive,
} from "@/service/dodo";

export const claimWebhook = async (webhookId: string) => {
  const db = firestoreAdmin();
  const ref = db.collection(DODO_WEBHOOK_EVENTS).doc(webhookId);
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return false;
    transaction.create(ref, { status: "processing", createdAt: new Date() });
    return true;
  });
};

const eventId = (payload: any) => {
  if (payload.type === "payment.succeeded") {
    return `payment.succeeded:${payload.data.payment_id}`;
  }
  if (payload.type === "subscription.active") {
    return `subscription.active:${payload.data.subscription_id}`;
  }
  return null;
};

export const handleDodoPayload = async (payload: any) => {
  const webhookId = eventId(payload);
  if (!webhookId || !(await claimWebhook(webhookId))) return;
  try {
    if (payload.type === "payment.succeeded") {
      await recordPaymentSucceeded({
        payment: payload.data as unknown as Payment,
      });
    } else if (payload.type === "subscription.active") {
      await recordSubscriptionActive({
        subscription: payload.data as unknown as Subscription,
      });
    }

    await firestoreAdmin()
      .collection(DODO_WEBHOOK_EVENTS)
      .doc(webhookId)
      .set(
        { status: "processed", type: payload.type, processedAt: new Date() },
        { merge: true },
      );
  } catch (error) {
    await firestoreAdmin()
      .collection(DODO_WEBHOOK_EVENTS)
      .doc(webhookId)
      .delete()
      .catch(() => undefined);
    throw error;
  }
};

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || "",
  onPayload: handleDodoPayload,
});

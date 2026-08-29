import type { Payment } from "dodopayments/resources/payments";
import type { Subscription } from "dodopayments/resources/subscriptions";

import { DODO_WEBHOOK_EVENTS } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { Webhooks } from "@/lib/dodo-nextjs";
import {
  recordPaymentSucceeded,
  recordSubscriptionLifecycle,
} from "@/service/dodo";
import { createHash } from "crypto";

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
  if (payload.type?.startsWith("subscription.")) {
    const digest = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex")
      .slice(0, 24);
    return `${payload.type}:${payload.data.subscription_id}:${digest}`;
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
    } else if (payload.type.startsWith("subscription.")) {
      await recordSubscriptionLifecycle({
        subscription: payload.data as unknown as Subscription,
        eventType: payload.type,
        eventCreatedAt:
          payload.timestamp || payload.created_at || payload.data?.updated_at,
        webhookEventId: webhookId,
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

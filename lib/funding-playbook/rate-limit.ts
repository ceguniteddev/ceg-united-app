import * as admin from "firebase-admin";
import { db } from "./firestore-helpers";

export class RateLimitExceededError extends Error {
  constructor(clientId: string, limit: number) {
    super(
      `Client ${clientId} has exceeded the daily generatePlaybook limit of ${limit}.`,
    );
    this.name = "RateLimitExceededError";
  }
}

const DEFAULT_DAILY_LIMIT = 20;

function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function checkAndIncrementRateLimit(
  clientId: string,
  action: string,
  dailyLimit = DEFAULT_DAILY_LIMIT,
): Promise<void> {
  const dayKey = utcDayKey();
  const ref = db()
    .collection("rate_limits")
    .doc(`${clientId}_${action}_${dayKey}`);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data()?.count as number) : 0;
    if (current >= dailyLimit) {
      throw new RateLimitExceededError(clientId, dailyLimit);
    }
    tx.set(
      ref,
      {
        clientId,
        action,
        dayKey,
        count: current + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

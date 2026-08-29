import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  getMembershipDunningAction,
  MEMBERSHIP_REMINDER_INTERVAL_MS,
} from "./membershipDunningCore";

if (!admin.apps.length) admin.initializeApp();

const projectId = process.env.GCLOUD_PROJECT || "cegunitedllc";
const databaseId =
  process.env.FIREBASE_DB_NAME ||
  (projectId === "ceg-united-llc-prod"
    ? "ceg-united-db-production"
    : "ceg-united-db-staging");
const db = getFirestore(databaseId);
const userIdForMembership = (path: string) => path.split("/").at(-3) || "";

const paymentRecoveryHtml = ({
  firstName,
  retryAccessUntil,
  settingsUrl,
}: {
  firstName: string;
  retryAccessUntil: string;
  settingsUrl: string;
}) => `<p>Hi ${firstName || "there"},</p>
<p>We could not process your CEG Brain membership renewal. Your paid access remains available while Dodo Payments retries the charge.</p>
<p>Please update your payment information before <strong>${retryAccessUntil}</strong> to avoid moving to the Free plan.</p>
<p><a href="${settingsUrl}">Update payment information</a></p>
<p>For security, CEG United never receives or stores your card details.</p>`;

const accessEndedHtml = ({
  firstName,
  settingsUrl,
}: {
  firstName: string;
  settingsUrl: string;
}) => `<p>Hi ${firstName || "there"},</p>
<p>Your Dodo Payments retry period has ended and your effective CEG Brain plan is now Free.</p>
<p>You can restore paid access by updating your billing information and resolving the outstanding subscription payment.</p>
<p><a href="${settingsUrl}">Manage billing</a></p>`;

export const processMembershipDunning = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "UTC",
    retryCount: 3,
  },
  async () => {
    const now = Timestamp.now();
    const enforce = process.env.MEMBERSHIP_DUNNING_ENFORCEMENT === "true";
    const settingsUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://cegunited.com"}/settings/membership`;
    const due = await db
      .collectionGroup("membership")
      .where("entitlementStatus", "==", "grace")
      .where("nextReminderAt", "<=", now)
      .limit(200)
      .get();

    for (const membership of due.docs) {
      const userId = userIdForMembership(membership.ref.path);
      if (!userId || membership.id !== "current") continue;

      const user = await db.collection("user").doc(userId).get();
      const userData = user.data() || {};
      if (!userData.email) {
        logger.warn("Skipping membership reminder without email", { userId });
        continue;
      }

      await db.runTransaction(async (transaction) => {
        const fresh = await transaction.get(membership.ref);
        const data = fresh.data();
        if (!data) return;
        const nextReminderAt = data.nextReminderAt?.toDate?.();
        const retryAccessUntil = data.retryAccessUntil?.toDate?.();
        const action = getMembershipDunningAction({
          entitlementStatus: data.entitlementStatus,
          nextReminderAt,
          retryAccessUntil,
          now: now.toDate(),
          enforce,
        });
        if (action === "skip") return;
        const recoveryEpisode =
          data.paymentFailureStartedAt?.toMillis?.() || "unknown";
        if (action === "observe_expired" || action === "downgrade") {
          if (action === "observe_expired") {
            logger.info("Observe-only membership downgrade", {
              userId,
              subscriptionId: data.subscriptionId,
            });
            transaction.update(membership.ref, {
              nextReminderAt: Timestamp.fromMillis(
                Date.now() + MEMBERSHIP_REMINDER_INTERVAL_MS,
              ),
              lastObservedExpiredAt: now,
            });
            return;
          }

          const finalMailRef = db
            .collection("mail")
            .doc(`membership-ended-${data.subscriptionId}-${recoveryEpisode}`);
          transaction.create(finalMailRef, {
            to: userData.email,
            from: "CEG United LLC <noreply@cegunited.com>",
            job: "MEMBERSHIP_ACCESS_ENDED",
            message: {
              subject: "Your CEG Brain plan is now Free",
              html: accessEndedHtml({
                firstName: userData.firstName,
                settingsUrl,
              }),
            },
            createdAt: now,
          });
          transaction.update(membership.ref, {
            entitlementStatus: "free",
            status: "inactive",
            nextReminderAt: null,
            finalNoticeSentAt: now,
            updatedAt: now,
          });
          return;
        }

        const reminderCount = Number(data.reminderCount || 0);
        const mailRef = db
          .collection("mail")
          .doc(
            `membership-retry-${data.subscriptionId}-${recoveryEpisode}-${reminderCount}`,
          );
        transaction.create(mailRef, {
          to: userData.email,
          from: "CEG United LLC <noreply@cegunited.com>",
          job: "MEMBERSHIP_PAYMENT_RETRY",
          message: {
            subject: "Action needed: update your membership payment",
            html: paymentRecoveryHtml({
              firstName: userData.firstName,
              retryAccessUntil: retryAccessUntil
                ? retryAccessUntil.toLocaleDateString("en-US", {
                    timeZone: "UTC",
                    dateStyle: "long",
                  })
                : "the end of the retry period",
              settingsUrl,
            }),
          },
          createdAt: now,
        });
        transaction.update(membership.ref, {
          lastReminderAt: now,
          nextReminderAt: Timestamp.fromMillis(
            Date.now() + MEMBERSHIP_REMINDER_INTERVAL_MS,
          ),
          reminderCount: reminderCount + 1,
          updatedAt: now,
        });
      });
    }

    logger.info("Membership dunning run completed", {
      due: due.size,
      enforcement: enforce,
      databaseId,
    });
  },
);

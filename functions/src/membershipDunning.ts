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
  settingsUrl,
  productName,
  accessDescription,
}: {
  firstName: string;
  settingsUrl: string;
  productName: string;
  accessDescription: string;
}) => `<p>Hi ${firstName || "there"},</p>
<p>We were unable to process your most recent payment for your ${productName}.</p>
<p>As a result, your access to ${productName} has been temporarily suspended, including access to ${accessDescription}.</p>
<p>To restore your access, simply click the link below to update your payment method and complete the outstanding payment:</p>
<p>🔗 <a href="${settingsUrl}"><strong>UPDATE PAYMENT METHOD</strong></a></p>
<p>Once your payment is successfully processed, your ${productName} access will be restored.</p>
<p>If you need any assistance, simply reply to this message and our team will be happy to help.</p>
<p>— CEG United Team</p>`;

const accessEndedHtml = ({
  firstName,
  settingsUrl,
  productName,
}: {
  firstName: string;
  settingsUrl: string;
  productName: string;
}) => `<p>Hi ${firstName || "there"},</p>
<p>Your Dodo Payments retry period has ended and your ${productName} paid access is now inactive.</p>
<p>You can restore access by updating your billing information and resolving the outstanding subscription payment.</p>
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
    const [membershipDue, addonDue] = await Promise.all([
      db
        .collectionGroup("membership")
        .where("entitlementStatus", "==", "grace")
        .where("nextReminderAt", "<=", now)
        .limit(200)
        .get(),
      db
        .collectionGroup("addons")
        .where("entitlementStatus", "==", "grace")
        .where("nextReminderAt", "<=", now)
        .limit(200)
        .get(),
    ]);
    const due = [...membershipDue.docs, ...addonDue.docs];

    for (const membership of due) {
      const userId = userIdForMembership(membership.ref.path);
      const isAddon = membership.ref.path.includes("/addons/");
      if (!userId || (!isAddon && membership.id !== "current")) continue;
      const productName = isAddon
        ? "CEG Credit Repair Addon"
        : "CEG Brain membership";
      const accessDescription = isAddon
        ? "your credit repair tools and other Credit Repair Addon features"
        : "your funding tools, lender recommendations, and other membership features";
      const entityKey = isAddon ? membership.id : "membership";

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
            .doc(
              `subscription-ended-${entityKey}-${data.subscriptionId}-${recoveryEpisode}`,
            );
          transaction.create(finalMailRef, {
            to: userData.email,
            from: "CEG United LLC <noreply@cegunited.com>",
            job: "MEMBERSHIP_ACCESS_ENDED",
            message: {
              subject: `Your ${productName} access is now inactive`,
              html: accessEndedHtml({
                firstName: userData.firstName,
                settingsUrl,
                productName,
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
            `subscription-retry-${entityKey}-${data.subscriptionId}-${recoveryEpisode}-${reminderCount}`,
          );
        transaction.create(mailRef, {
          to: userData.email,
          from: "CEG United LLC <noreply@cegunited.com>",
          job: "MEMBERSHIP_PAYMENT_RETRY",
          message: {
            subject: `Action needed: update your ${productName} payment`,
            html: paymentRecoveryHtml({
              firstName: userData.firstName,
              settingsUrl,
              productName,
              accessDescription,
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
      due: due.length,
      enforcement: enforce,
      databaseId,
    });
  },
);

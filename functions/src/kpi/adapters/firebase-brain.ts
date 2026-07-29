/**
 * adapters/firebase-brain.ts
 * ----------------------------------------------------------------------------
 * Firebase / Firestore adapter — reads the CEG Brain app's own data:
 * audits, funding map clicks, approvals, deals, communications, clients.
 *
 * SDK: firebase-admin (npm install firebase-admin)
 * Auth: Service account JSON (see docs/START-HERE-DEVELOPER.md Section 3).
 *
 * This adapter is unique among the seven: it reads from the SAME Firestore
 * project that aggregate-daily.ts writes snapshots into. Make sure the
 * service account has at minimum Cloud Datastore Viewer on collections:
 *   deals, audits, communications, approvals, clients
 *
 * Env vars:
 *   FIREBASE_SERVICE_ACCOUNT_JSON   (required) Full JSON string OR path to file (see below)
 *   FIREBASE_PROJECT_ID             (optional) Override project id if not in the service account JSON
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";
import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, requireEnv, safeDiv, withRetry } from "./_util";

let app: admin.app.App | null = null;

/**
 * Lazily initializes the firebase-admin app exactly once per process.
 * Accepts either:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON = the raw JSON string of the service account key
 *   - FIREBASE_SERVICE_ACCOUNT_JSON = an absolute file path to the service account key JSON
 * This dual mode makes local dev (file path) and Cloud Functions deploy (env-injected JSON secret) both easy.
 */
function getApp(): admin.app.App {
  if (app) return app;

  const raw = requireEnv("FIREBASE_SERVICE_ACCOUNT_JSON");
  let credentialJson: admin.ServiceAccount;

  if (raw.trim().startsWith("{")) {
    credentialJson = JSON.parse(raw);
  } else {
    // Treat as a file path.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    credentialJson = JSON.parse(fs.readFileSync(raw, "utf-8"));
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(credentialJson),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  return app;
}

function db(): FirebaseFirestore.Firestore {
  return getApp().firestore();
}

/** Converts a DateRange into Firestore Timestamp bounds (inclusive start, exclusive end-of-day). */
function toTimestampBounds(range: DateRange): { start: admin.firestore.Timestamp; end: admin.firestore.Timestamp } {
  const start = admin.firestore.Timestamp.fromDate(new Date(range.start + "T00:00:00.000Z"));
  const end = admin.firestore.Timestamp.fromDate(new Date(range.end + "T23:59:59.999Z"));
  return { start, end };
}

/** Fetches all docs from a collection within a timestamp field range, paginated in batches of 500. */
async function queryRange(
  collection: string,
  timestampField: string,
  range: DateRange,
  extraFilter?: (q: FirebaseFirestore.Query) => FirebaseFirestore.Query
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const { start, end } = toTimestampBounds(range);
  let query: FirebaseFirestore.Query = db()
    .collection(collection)
    .where(timestampField, ">=", start)
    .where(timestampField, "<=", end);

  if (extraFilter) query = extraFilter(query);

  const docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  const PAGE_SIZE = 500;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let pageQuery = query.orderBy(timestampField).limit(PAGE_SIZE);
    if (lastDoc) pageQuery = pageQuery.startAfter(lastDoc);
    const snap = await withRetry(() => pageQuery.get());
    docs.push(...snap.docs);
    if (snap.docs.length < PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }
  return docs;
}

export const firebaseBrainAdapter: Adapter = {
  id: "firebase",
  displayName: "Firebase / CEG Brain",

  async test(): Promise<AdapterTestResult> {
    try {
      await withRetry(() => db().collection("audits").limit(1).get());
      return { ok: true, message: "Firestore connection OK" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    const [auditDocs, approvalDocs, communicationDocs] = await Promise.all([
      queryRange("audits", "completedAt", range, (q) => q.where("status", "==", "completed")),
      queryRange("approvals", "createdAt", range),
      queryRange("communications", "createdAt", range),
    ]);

    // Funding map clicks are logged as lightweight event docs, not full audit records.
    const fundingMapClickDocs = await queryRange("events", "createdAt", range, (q) =>
      q.where("type", "==", "funding_map_click")
    );

    const auditsCompleted = auditDocs.length;

    const auditDurationsHours = auditDocs
      .map((doc) => {
        const data = doc.data();
        const startedAt = toMillis(data.startedAt);
        const completedAt = toMillis(data.completedAt);
        if (!startedAt || !completedAt) return null;
        return (completedAt - startedAt) / (1000 * 60 * 60);
      })
      .filter((v): v is number => v !== null);

    const avgAuditTime =
      auditDurationsHours.length > 0
        ? auditDurationsHours.reduce((a, b) => a + b, 0) / auditDurationsHours.length
        : 0;

    const fundingMapClicks = fundingMapClickDocs.length;

    // audit -> payment conversion needs a matching "clients" lookup for paid status.
    const clientDocs = await db().collection("clients").get();
    const paidAfterAudit = clientDocs.docs.filter((doc) => {
      const data = doc.data();
      return data.paid === true && data.auditCompleted === true;
    }).length;
    const auditToPayment = safeDiv(paidAfterAudit, auditsCompleted || 1);

    const approvedDocs = approvalDocs.filter((d) => d.data().status === "approved");

    const daysAuditToApproval = approvedDocs
      .map((doc) => {
        const data = doc.data();
        const approvedAt = toMillis(data.approvedAt);
        const auditCompletedAt = toMillis(data.auditCompletedAt);
        if (!approvedAt || !auditCompletedAt) return null;
        return (approvedAt - auditCompletedAt) / (1000 * 60 * 60 * 24);
      })
      .filter((v): v is number => v !== null);
    const avgDaysAuditToApproval = average(daysAuditToApproval);

    const daysApprovalToFunding = approvedDocs
      .map((doc) => {
        const data = doc.data();
        const approvedAt = toMillis(data.approvedAt);
        const fundedAt = toMillis(data.fundedAt);
        if (!approvedAt || !fundedAt) return null;
        return (fundedAt - approvedAt) / (1000 * 60 * 60 * 24);
      })
      .filter((v): v is number => v !== null);
    const avgDaysApprovalToFunding = average(daysApprovalToFunding);

    const approvalRate = safeDiv(approvedDocs.length, approvalDocs.length || 1);

    const approvalAmounts = approvedDocs
      .map((d) => Number(d.data().amount) || 0)
      .filter((v) => v > 0);
    const avgApprovalAmount = average(approvalAmounts);
    const totalCapitalApproved = approvalAmounts.reduce((a, b) => a + b, 0);

    return {
      auditsCompleted: metric(auditsCompleted, { sampleSize: auditsCompleted }),
      avgAuditTime: metric(avgAuditTime, { format: "hours" }),
      fundingMapClicks: metric(fundingMapClicks),
      auditToPayment: metric(auditToPayment, { format: "percent" }),
      avgDaysAuditToApproval: metric(avgDaysAuditToApproval, { format: "days" }),
      avgDaysApprovalToFunding: metric(avgDaysApprovalToFunding, { format: "days" }),
      approvalRate: metric(approvalRate, { format: "percent", sampleSize: approvalDocs.length }),
      avgApprovalAmount: metric(avgApprovalAmount, { format: "currency" }),
      totalCapitalApproved: metric(totalCapitalApproved, { format: "currency" }),
      communicationsSentThisWeek: metric(communicationDocs.length),
    };
  },
};

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (typeof value === "string") {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === "number") return value;
  return null;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default firebaseBrainAdapter;

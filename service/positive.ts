import crypto from "crypto";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { getCRSReport } from "@/service/crs";
import {
  categories,
  bureaus,
  stages,
  buildPlan,
  transition,
  refreshEligibility,
  isCurrentProvider,
  validateScoreEstimate,
  directoryCandidates,
  type CreditReport,
  type Snapshot,
  type Provider,
  type Enrollment,
  type RefreshState,
  type Rule,
  type Bureau,
  type Category,
  type Stage,
  type ClientContext,
  contextSchema,
  reportSchema,
  providerSchema,
} from "@/lib/positive/core";

const initialRefresh: RefreshState = {
  status: "idle",
  lastSuccessAt: null,
  requestId: null,
  error: null,
};

const sha = (x: string) =>
  crypto.createHash("sha256").update(x).digest("hex").slice(0, 32);

function detectBureau(itemType?: string, report?: any): Bureau | null {
  if (itemType) {
    const s = itemType.toLowerCase();
    if (s.includes("experian")) return "experian";
    if (s.includes("equifax")) return "equifax";
    if (s.includes("trans")) return "transunion";
  }

  const fromScore = report?.scores?.[0]?.sourceType;
  if (fromScore) {
    const s = fromScore.toLowerCase();
    if (s.includes("experian")) return "experian";
    if (s.includes("equifax")) return "equifax";
    if (s.includes("trans")) return "transunion";
  }

  const fromFile = report?.creditFiles?.[0]?.creditFileDetail?.sourceType;
  if (fromFile) {
    const s = fromFile.toLowerCase();
    if (s.includes("experian")) return "experian";
    if (s.includes("equifax")) return "equifax";
    if (s.includes("trans")) return "transunion";
  }

  const r = report?.repositoryIncluded;
  if (r) {
    if (r.experian) return "experian";
    if (r.equifax) return "equifax";
    if (r.transunion) return "transunion";
  }

  return null;
}

/**
 * Normalizes live CRS data in Firestore (from crs-report-data collection) into the standard CreditReport schema.
 */
function normalizeCrsToPositiveReport(
  crsData: any,
  pulledAtStr?: string,
): CreditReport | null {
  if (!crsData) return null;

  try {
    const rawList = Array.isArray(crsData) ? crsData : [crsData];
    const creditReports = rawList
      .filter((d): d is any => {
        if (
          !d ||
          d.id === "issues" ||
          d.id === "dti" ||
          d.type === "issues" ||
          d.type === "dti"
        )
          return false;
        return Array.isArray(d.report?.scores) || Array.isArray(d.scores);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

    if (creditReports.length === 0) return null;

    const accounts: any[] = [];
    const seenAccounts = new Set<string>();
    let negativeCount = 0;
    let inquiriesCount = 0;
    let latestPulledAt = pulledAtStr || new Date().toISOString();

    const latestScoresMap = new Map<
      Bureau,
      { value: number; model: string; pulledAt: string }
    >();
    const prevScoresMap = new Map<Bureau, number>();

    for (const item of creditReports) {
      const rep = item.report || item;
      const b = detectBureau(item.type, rep);
      if (!b) continue;

      const itemDate = item.createdAt
        ? typeof item.createdAt === "string"
          ? item.createdAt
          : item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : typeof item.createdAt?.toDate === "function"
              ? item.createdAt.toDate().toISOString()
              : new Date().toISOString()
        : new Date().toISOString();

      if (new Date(itemDate).getTime() > new Date(latestPulledAt).getTime()) {
        latestPulledAt = itemDate;
      }

      // Check scores
      const sc = rep.scores?.[0];
      const val = Number(sc?.scoreValue ?? rep.scoreValue ?? rep.score);
      if (!isNaN(val) && val > 0) {
        if (!latestScoresMap.has(b)) {
          latestScoresMap.set(b, {
            value: Math.max(250, Math.min(900, Math.round(val))),
            model: sc?.modelName || "FICO Score 8",
            pulledAt: itemDate,
          });
        } else if (!prevScoresMap.has(b)) {
          prevScoresMap.set(b, Math.max(250, Math.min(900, Math.round(val))));
        }
      }

      // Extract tradelines
      if (Array.isArray(rep.tradelines)) {
        for (const t of rep.tradelines) {
          const rawId =
            t.accountIdentifier ||
            `${t.creditorName || "acct"}_${t.accountOpenedDate || ""}`;
          const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
          if (!cleanId || seenAccounts.has(cleanId)) continue;
          seenAccounts.add(cleanId);

          const bal = Number(t.currentBalanceAmount);
          const lim = Number(t.creditLimitAmount);
          const isAu =
            t.accountOwnershipType?.toLowerCase().includes("auth") ||
            t.accountOwnershipType?.toLowerCase().includes("au");
          const isInstallment =
            t.accountType?.toLowerCase().includes("installment") ||
            t.loanType?.toLowerCase().includes("installment") ||
            t.loanType?.toLowerCase().includes("auto") ||
            t.loanType?.toLowerCase().includes("mortgage");
          const isRent =
            t.creditorName?.toLowerCase().includes("rent") ||
            t.accountType?.toLowerCase().includes("rent");

          const isPositive =
            !t.derogatoryDataIndicator &&
            Number(t._30DayLates || 0) === 0 &&
            Number(t._60DayLates || 0) === 0 &&
            Number(t._90DayLates || 0) === 0;

          if (!isPositive) negativeCount++;

          const srcBureau = (t.sourceType || item.type || "").toLowerCase();
          const tBureaus: Bureau[] = [];
          if (srcBureau.includes("experian")) tBureaus.push("experian");
          if (srcBureau.includes("equifax")) tBureaus.push("equifax");
          if (srcBureau.includes("trans")) tBureaus.push("transunion");
          if (tBureaus.length === 0) tBureaus.push(b);

          accounts.push({
            id: cleanId,
            name: t.creditorName || "Credit Line",
            ownership: isAu ? "au" : "primary",
            kind: isRent ? "rent" : isInstallment ? "installment" : "revolving",
            status: t.accountStatusType?.toLowerCase().includes("close")
              ? "closed"
              : "open",
            positive: isPositive,
            balance: isNaN(bal) ? null : Math.max(0, bal),
            limit: isNaN(lim) ? null : Math.max(0, lim),
            originalPrincipal: null,
            openedAt: t.accountOpenedDate
              ? new Date(t.accountOpenedDate).toISOString()
              : null,
            bureaus: tBureaus,
            providerId: null,
          });
        }
      }

      if (Array.isArray(rep.inquiries)) {
        inquiriesCount += rep.inquiries.length;
      }
    }

    const scores: any[] = [];
    const allBureaus: Bureau[] = ["equifax", "transunion", "experian"];
    for (const b of allBureaus) {
      const s = latestScoresMap.get(b);
      const prev = prevScoresMap.get(b) || (s?.value ? s.value : 0);
      const val = s?.value || 0;
      const delta = prev && val ? val - prev : 0;

      scores.push({
        bureau: b,
        model: s?.model || "FICO Score 8",
        value: val,
        pulledAt: s?.pulledAt || latestPulledAt,
        prevScore: prev,
        delta,
      });
    }

    return {
      id: `report_${Date.now()}`,
      pulledAt: latestPulledAt,
      source: "CEG United 3-Bureau Report Ingest",
      scores,
      accounts,
      negativeCount,
      hardInquiries6m: Math.min(inquiriesCount, 10),
    };
  } catch (err) {
    console.error("Error normalizing CRS report:", err);
    return null;
  }
}

export async function getUserPositiveSnapshot(
  userId: string,
  admin = false,
): Promise<Snapshot> {
  const db = firestoreAdmin();

  // 1. Fetch collections in parallel
  const [
    reportDoc,
    ctxDoc,
    refreshDoc,
    providersSnap,
    rulesSnap,
    enrollmentsSnap,
    crsReports,
  ] = await Promise.all([
    db.doc(`user/${userId}/credit/current`).get(),
    db.doc(`user/${userId}/positive/context`).get(),
    db.doc(`user/${userId}/credit/refresh`).get(),
    db.collection("positive_providers").get(),
    db.collection("positive_rules").get(),
    db.collection(`user/${userId}/positiveEnrollments`).get(),
    getCRSReport(userId),
  ]);

  // Context parsing with fallback defaults
  const context = contextSchema.parse(
    ctxDoc.exists
      ? ctxDoc.data()
      : {
          paidCoaching: true,
          paidDisputes: false,
          monthlyBudget: 100,
          depositBudget: 500,
          monthlyDebt: 800,
          monthlyIncome: 4500,
          rents: true,
          eligibleBills: 2,
          timezone: "America/New_York",
          smsConsent: false,
        },
  );

  // Providers list
  let providers: Provider[] = [];
  if (!providersSnap.empty) {
    providers = providersSnap.docs
      .map((d) => {
        try {
          return providerSchema.parse(d.data());
        } catch {
          return null;
        }
      })
      .filter((p): p is Provider => !!p && (admin || p.status === "published"));
  }

  // If no providers stored in DB, seed in memory from directoryCandidates
  if (providers.length === 0) {
    providers = directoryCandidates.filter(
      (p) => admin || p.status === "published",
    );
  }

  // Rules list
  const rules: Rule[] = rulesSnap.docs.map((d) => d.data() as Rule);

  // Enrollments list
  const enrollments: Enrollment[] = enrollmentsSnap.docs.map(
    (d) => d.data() as Enrollment,
  );

  // Refresh state
  const refreshData = refreshDoc.exists ? refreshDoc.data() : {};

  // Report resolution: custom report -> normalized raw CRS from crs-report-data -> null
  let report: CreditReport | null = null;
  if (reportDoc.exists) {
    try {
      report = reportSchema.parse(reportDoc.data());
    } catch {
      report = null;
    }
  }

  if (!report && crsReports && crsReports.length > 0) {
    report = normalizeCrsToPositiveReport(crsReports);
  }

  const refresh: RefreshState = {
    ...initialRefresh,
    ...(refreshData as any),
    lastSuccessAt: refreshData?.lastSuccessAt || report?.pulledAt || null,
  };

  // Check dispute status
  let disputeStatus: string | null = null;
  try {
    const disputeSnap = await db
      .collection(`user/${userId}/disputeLines`)
      .limit(50)
      .get();
    if (!disputeSnap.empty) {
      const activeCount = disputeSnap.docs.filter(
        (d) => !d.id.startsWith("_") && d.get("status") === "active",
      ).length;
      disputeStatus = `${activeCount} active dispute lines`;
    }
  } catch {
    disputeStatus = null;
  }

  return {
    report,
    context,
    providers,
    rules,
    enrollments,
    refresh,
    canAdmin: admin,
    demo: false,
    disputeStatus,
  };
}

export async function selectPositiveProviders({
  userId,
  category,
  ids,
  bureau,
  reportId,
}: {
  userId: string;
  category: Category;
  ids: string[];
  bureau: Bureau;
  reportId: string;
}): Promise<Snapshot> {
  const db = firestoreAdmin();
  const snapshot = await getUserPositiveSnapshot(userId);

  if (!snapshot.report) {
    throw new Error("A credit report is required before selecting providers.");
  }

  const plan = buildPlan(snapshot, bureau, new Date().toISOString());
  const allowed =
    plan.steps.find((s) => s.category === category)?.quantity ?? 0;
  if (ids.length > allowed) {
    throw new Error("This selection exceeds the current recommendation.");
  }

  const picks = ids
    .map((id) => snapshot.providers.find((p) => p.id === id))
    .filter((p): p is Provider => !!p);

  const now = new Date().toISOString();
  for (const p of picks) {
    const eRef = db.doc(`user/${userId}/positiveEnrollments/${p.id}`);
    const existing = await eRef.get();
    if (!existing.exists) {
      const enrollment: Enrollment = {
        id: p.id,
        providerId: p.id,
        category: p.category,
        name: p.name,
        stage: "selected",
        version: 1,
        providerVersion: p.version,
        updatedAt: now,
        nextCheckAt: new Date(Date.now() + 86400000).toISOString(),
        documentPath: null,
        matchedAccountId: null,
        helpRequested: false,
      };
      await eRef.set(enrollment);
    }
  }

  return getUserPositiveSnapshot(userId);
}

export async function advancePositiveMilestone({
  userId,
  enrollmentId,
  version = 1,
  nextStage,
  documentPath,
  documentUrl,
}: {
  userId: string;
  enrollmentId: string;
  version?: number;
  nextStage: Stage;
  documentPath?: string | null;
  documentUrl?: string | null;
}): Promise<Snapshot> {
  const db = firestoreAdmin();
  const eRef = db.doc(`user/${userId}/positiveEnrollments/${enrollmentId}`);
  const snap = await eRef.get();

  if (!snap.exists) {
    throw new Error("Enrollment not found");
  }

  const e = snap.data() as Enrollment;
  const next = transition(
    e.stage,
    nextStage,
    "client",
    !!(e.documentPath || documentPath),
    false,
  );

  const payload: Record<string, any> = {
    stage: next,
    version: (e.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    nextCheckAt: new Date(
      Date.now() + (next === "waiting" ? 30 : 2) * 86400000,
    ).toISOString(),
  };

  if (documentPath) payload.documentPath = documentPath;
  if (documentUrl) payload.documentUrl = documentUrl;

  await eRef.set(payload, { merge: true });
  return getUserPositiveSnapshot(userId);
}

export async function attachPositiveDocument({
  userId,
  enrollmentId,
  path,
}: {
  userId: string;
  enrollmentId: string;
  path: string;
}): Promise<Snapshot> {
  const db = firestoreAdmin();
  const eRef = db.doc(`user/${userId}/positiveEnrollments/${enrollmentId}`);
  const snap = await eRef.get();

  if (!snap.exists) throw new Error("Enrollment not found");

  await eRef.set(
    {
      documentPath: path,
      stage: "documents",
      version: (snap.get("version") || 1) + 1,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return getUserPositiveSnapshot(userId);
}

export async function uploadPositiveDocumentFile({
  userId,
  enrollmentId,
  file,
}: {
  userId: string;
  enrollmentId: string;
  file: File;
}): Promise<{ path: string; url: string; snapshot: Snapshot }> {
  const bucket = storageAdmin();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  const path = `user/${userId}/positive/${enrollmentId}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blob = bucket.file(path);

  await blob.save(buffer, {
    metadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  let downloadUrl = "";
  try {
    const [url] = await blob.getSignedUrl({
      action: "read",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    downloadUrl = url;
  } catch {
    downloadUrl = path;
  }

  const snapshot = await attachPositiveDocument({
    userId,
    enrollmentId,
    path,
  });

  return { path, url: downloadUrl, snapshot };
}

export async function requestPositiveHelp({
  userId,
  enrollmentId,
  enrollmentName,
  message,
}: {
  userId: string;
  enrollmentId: string;
  enrollmentName: string;
  message: string;
}): Promise<void> {
  const db = firestoreAdmin();
  const timestamp = Date.now();
  const taskRef = db.doc(
    `user/${userId}/positiveEnrollments/${enrollmentId}/helpRequests/${timestamp}`,
  );

  await taskRef.set({
    enrollmentId,
    enrollmentName,
    message,
    status: "open",
    createdAt: new Date().toISOString(),
  });

  const eRef = db.doc(`user/${userId}/positiveEnrollments/${enrollmentId}`);
  await eRef.set({ helpRequested: true }, { merge: true });
}

export async function setPositiveConsent({
  userId,
  enabled,
}: {
  userId: string;
  enabled: boolean;
}): Promise<Snapshot> {
  const db = firestoreAdmin();
  await db.doc(`user/${userId}/positive/context`).set(
    {
      smsConsent: enabled,
      consentAt: new Date().toISOString(),
    },
    { merge: true },
  );
  return getUserPositiveSnapshot(userId);
}

export async function estimatePositiveScenario({
  userId,
  bureau,
  model,
  providerIds,
}: {
  userId: string;
  bureau: Bureau;
  model: string;
  providerIds: string[];
}): Promise<{
  available: boolean;
  low?: number;
  high?: number;
  provider?: string;
  reason?: string;
}> {
  const snapshot = await getUserPositiveSnapshot(userId);
  if (!snapshot.report) return { available: false, reason: "No credit report" };

  const currentScore =
    snapshot.report.scores.find((s) => s.bureau === bureau)?.value || 640;

  // Calculate dynamic projected point gain based on provider count and category mix
  let simulatedGain = 0;
  for (const pid of providerIds) {
    const p = snapshot.providers.find((x) => x.id === pid);
    if (!p) continue;
    if (p.category === "au") simulatedGain += 25;
    else if (p.category === "installment") simulatedGain += 15;
    else if (p.category === "revolving" || p.category === "cards")
      simulatedGain += 18;
    else if (p.category === "rent" || p.category === "bills")
      simulatedGain += 10;
  }

  // Diminishing returns calculation
  const totalGain = Math.min(Math.round(simulatedGain * 0.85), 75);
  const low = Math.min(850, currentScore + Math.max(8, totalGain - 10));
  const high = Math.min(850, currentScore + totalGain + 12);

  return {
    available: true,
    low,
    high,
    provider: "CEG Predictive FICO Simulator",
  };
}

export async function seedPositiveRecommendation(
  userId: string,
): Promise<void> {
  const db = firestoreAdmin();
  const eRef = db.doc(`user/${userId}/positiveEnrollments/chase_sapphire_au`);

  await eRef.set(
    {
      id: "chase_sapphire_au",
      providerId: "chase_sapphire_au",
      category: "au",
      name: "Chase Sapphire Preferred (AU Tradeline)",
      stage: "selected",
      version: 1,
      providerVersion: 1,
      limit: 15000,
      balance: 300,
      monthlyCost: 0,
      setupCost: 350,
      updatedAt: new Date().toISOString(),
      nextCheckAt: new Date(Date.now() + 86400000).toISOString(),
      documentPath: null,
      matchedAccountId: null,
      helpRequested: false,
    },
    { merge: true },
  );
}

export async function publishPositiveProvider(
  provider: Provider,
): Promise<void> {
  const db = firestoreAdmin();
  const parsed = providerSchema.parse(provider);
  await db.doc(`positive_providers/${parsed.id}`).set(parsed, { merge: true });
}

export async function publishPositiveRule(rule: Rule): Promise<void> {
  const db = firestoreAdmin();
  await db.doc(`positive_rules/${rule.id}`).set(rule, { merge: true });
}

export async function updatePositiveContext(
  userId: string,
  context: ClientContext,
): Promise<void> {
  const db = firestoreAdmin();
  const parsed = contextSchema.parse(context);
  await db.doc(`user/${userId}/positive/context`).set(parsed, { merge: true });
}

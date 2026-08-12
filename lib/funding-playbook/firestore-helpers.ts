import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  USER_COLLECTION,
  BANK_MANAGEMENT_COLLECTION,
  BANK_PRODUCTS_COLLECTION,
  CRS_REPORT_DATA,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import type {
  ClientProfile,
  Lender,
  Product,
  Playbook,
  BranchCacheDoc,
  LenderHistoryEntry,
} from "@/types/funding-playbook";

export function db() {
  return firestoreAdmin();
}

/** Sub-collection names under crs-report-data/{userId} */
const CRS_SUB_COLLECTIONS = [
  "dti",
  "equifax",
  "experian",
  "issues",
  "transunion",
] as const;

type CRSSubCollection = (typeof CRS_SUB_COLLECTIONS)[number];

/**
 * Fetches the latest document from each CRS report sub-collection for a user.
 * Each sub-collection stores the latest report in a doc whose ID matches the
 * sub-collection name (e.g. `equifax/equifax`). Backup docs have a timestamp
 * suffix (e.g. `equifax/equifax-1781798424554`) and are excluded.
 */
async function getCRSReportData(
  clientId: string,
): Promise<Record<CRSSubCollection, any | null>> {
  const result = {} as Record<CRSSubCollection, any | null>;

  const parentRef = db().collection(CRS_REPORT_DATA).doc(clientId);
  const parentSnap = await parentRef.get();

  if (!parentSnap.exists) {
    // No CRS data exists for this user – return nulls
    for (const sub of CRS_SUB_COLLECTIONS) result[sub] = null;
    return result;
  }

  await Promise.all(
    CRS_SUB_COLLECTIONS.map(async (sub) => {
      // The latest doc ID is the same as the sub-collection name
      const docSnap = await parentRef.collection(sub).doc(sub).get();
      result[sub] = docSnap.exists
        ? normalizeAllDates(docSnap.data() ?? {})
        : null;
    }),
  );

  return result;
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

// ── Helpers for extracting scores from CRS bureau reports ────────────

/** Extract the FICO score from a CRS bureau report document. */
function extractBureauScore(reportDoc: any): number {
  if (!reportDoc?.report) return 0;
  const report = reportDoc.report;
  // report.scores is an array of CreditScore objects
  if (Array.isArray(report.scores) && report.scores.length > 0) {
    return Number(report.scores[0].scoreValue) || 0;
  }
  return 0;
}

/** Build a CreditReportSummary-compatible object from a CRS bureau doc. */
function buildCreditReport(bureau: string, reportDoc: any) {
  const report = reportDoc?.report;
  const score = extractBureauScore(reportDoc);
  const tradelines: any[] = report?.tradelines ?? [];
  const inquiries: any[] = report?.inquiries ?? [];

  const revolvingTradelines = tradelines.filter(
    (t) =>
      t.accountType?.toLowerCase().includes("revolving") ||
      t.loanType?.toLowerCase().includes("revolving"),
  );
  const totalRevolvingLimit = revolvingTradelines.reduce(
    (sum, t) => sum + (Number(t.creditLimitAmount) || 0),
    0,
  );
  const totalRevolvingBalance = revolvingTradelines.reduce(
    (sum, t) => sum + (Number(t.currentBalanceAmount) || 0),
    0,
  );

  // Oldest account age in months
  const openDates = tradelines
    .map((t) => t.accountOpenedDate)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !isNaN(t));
  const oldestAccountAgeMonths =
    openDates.length > 0
      ? Math.floor(
          (Date.now() - Math.min(...openDates)) / (1000 * 60 * 60 * 24 * 30),
        )
      : 0;

  // Inquiries in last 6 months
  const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
  const recentInquiries = inquiries.filter((i) => {
    const d = new Date(i.inquiryDate).getTime();
    return !isNaN(d) && d >= sixMonthsAgo;
  });

  const derogatoryCount = tradelines.filter(
    (t) => t.derogatoryDataIndicator === true,
  ).length;

  return {
    bureau,
    score,
    unpaidDerogatoryAccountsCount: derogatoryCount,
    recentInquiriesCountLast6Months: recentInquiries.length,
    oldestAccountAgeMonths,
    totalRevolvingLimit,
    totalRevolvingBalance,
  };
}

/** Extract DTI fields from the CRS dti sub-collection document. */
function extractDTI(dtiDoc: any) {
  if (!dtiDoc?.report) return null;
  const reportArr = Array.isArray(dtiDoc.report)
    ? dtiDoc.report
    : [dtiDoc.report];
  if (reportArr.length === 0) return null;
  const d = reportArr[0];
  return {
    dtiRatioPercent: d.finalDTI ?? d.dti ?? d.debtToIncomeRatio ?? null,
    monthlyDebtPayments:
      d.totalMonthlyDebtPayments ?? d.monthlyDebtPayments ?? null,
    monthlyGrossIncome: d.monthlyGrossIncome ?? null,
    rentOrMortgageMonthly:
      d.rentOrMortgageMonthly ?? d.monthlyHousingPayment ?? null,
  };
}

// ── Clients ──────────────────────────────────────────────────────────
// Reads from USER_COLLECTION ("user") for core profile data, and from
// CRS_REPORT_DATA ("crs-report-data") sub-collections for credit report
// data (equifax, experian, transunion, dti, issues).
export async function getClient(clientId: string): Promise<ClientProfile> {
  // Fetch user profile and CRS report data in parallel
  const [snap, crsData] = await Promise.all([
    db().collection(USER_COLLECTION).doc(clientId).get(),
    getCRSReportData(clientId),
  ]);

  if (!snap.exists) throw new NotFoundError("Client", clientId);
  const data = snap.data() as any;

  // Fetch lead document from user-leads collection if user.leadId exists
  let leadData: any = null;
  if (data.leadId) {
    try {
      const leadSnap = await db()
        .collection("user-leads")
        .doc(data.leadId)
        .get();
      if (leadSnap.exists) {
        leadData = leadSnap.data();
      }
    } catch (err) {
      console.warn(
        "Failed to fetch lead document for leadId:",
        data.leadId,
        err,
      );
    }
  }

  // ── Extract scores from CRS bureau sub-collections ──
  const experianScore = extractBureauScore(crsData.experian);
  const equifaxScore = extractBureauScore(crsData.equifax);
  const transunionScore = extractBureauScore(crsData.transunion);

  // Fallback to user-leads score or user-level ficoCreditScore if CRS data is absent
  const leadScore =
    leadData?.ficoCreditScore ||
    leadData?.creditScore ||
    leadData?.personalCreditScore ||
    leadData?.businessCreditScore ||
    0;
  const fallbackScore = leadScore || data.ficoCreditScore || 0;

  // ── Build credit reports from actual CRS data ──
  const creditReports = [];
  if (crsData.experian) {
    creditReports.push(buildCreditReport("Experian", crsData.experian));
  }
  if (crsData.equifax) {
    creditReports.push(buildCreditReport("Equifax", crsData.equifax));
  }
  if (crsData.transunion) {
    creditReports.push(buildCreditReport("TransUnion", crsData.transunion));
  }

  // ── Extract DTI from CRS dti sub-collection ──
  const crsDTI = extractDTI(crsData.dti);

  const monthlyHousing =
    crsDTI?.rentOrMortgageMonthly ||
    data.payPerMonth ||
    data.dti?.rentOrMortgageMonthly ||
    0;
  const annualIncome =
    data.income?.statedAnnualIncome ||
    leadData?.householdIncome ||
    leadData?.annualIncome ||
    leadData?.fundingAmount ||
    (data.employmentPayPerMonth ? data.employmentPayPerMonth * 12 : 0);

  const householdIncome =
    data.income?.householdIncome || leadData?.householdIncome || annualIncome;
  const monthlyGross =
    crsDTI?.monthlyGrossIncome ||
    data.dti?.monthlyGrossIncome ||
    (annualIncome ? Math.round(annualIncome / 12) : 0);
  const monthlyDebt =
    crsDTI?.monthlyDebtPayments ||
    data.dti?.monthlyDebtPayments ||
    data.dti?.totalMonthlyDebtService ||
    monthlyHousing;
  const dtiPct =
    crsDTI?.dtiRatioPercent ||
    data.dti?.dtiPct ||
    data.dti?.dtiRatioPercent ||
    (monthlyGross ? Math.round((monthlyDebt / monthlyGross) * 100) : 0);

  return {
    id: snap.id,
    firstName: data.firstName || data.displayName?.split(" ")[0] || "Client",
    lastName:
      data.lastName || data.displayName?.split(" ").slice(1).join(" ") || "",
    email: data.email || "",
    zip: data.addressPostal || data.zip || "32601",
    ...data,
    leadData,
    income: {
      statedAnnualIncome: annualIncome,
      householdIncome,
      verifiableIncomeMonthly:
        data.income?.verifiableIncomeMonthly || Math.round(annualIncome / 12),
      hasW2Employment: data.income?.hasW2Employment ?? true,
      hasTaxReturns: data.income?.hasTaxReturns ?? true,
      incomeDocumentationType:
        data.income?.incomeDocumentationType || "W2 / Paystubs",
      ...(data.income || {}),
    },
    dti: {
      rentOrMortgageMonthly: monthlyHousing,
      rentOrMortgageIsReported: data.dti?.rentOrMortgageIsReported ?? false,
      revolvingDebtMonthly: data.dti?.revolvingDebtMonthly || 200,
      totalMonthlyDebtService:
        data.dti?.totalMonthlyDebtService || monthlyHousing + 200,
      monthlyDebtPayments: monthlyDebt,
      monthlyGrossIncome: monthlyGross,
      dtiRatioPercent: dtiPct,
      dtiPct,
      ...(data.dti || {}),
      // CRS DTI overrides any user-level data when available
      ...(crsDTI || {}),
    },
    creditScores: {
      experian: experianScore || fallbackScore || 0,
      equifax: equifaxScore || fallbackScore || 0,
      transunion: transunionScore || fallbackScore || 0,
      ...(data.creditScores || {}),
    },
    creditReports:
      creditReports.length > 0
        ? creditReports
        : Array.isArray(data.creditReports)
          ? data.creditReports
          : [
              {
                bureau: "Experian",
                score: fallbackScore || 0,
                unpaidDerogatoryAccountsCount: 0,
                recentInquiriesCountLast6Months: 0,
                oldestAccountAgeMonths: 0,
                totalRevolvingLimit: 0,
                totalRevolvingBalance: 0,
              },
              {
                bureau: "Equifax",
                score: fallbackScore || 0,
                unpaidDerogatoryAccountsCount: 0,
                recentInquiriesCountLast6Months: 0,
                oldestAccountAgeMonths: 0,
                totalRevolvingLimit: 0,
                totalRevolvingBalance: 0,
              },
              {
                bureau: "TransUnion",
                score: fallbackScore || 0,
                unpaidDerogatoryAccountsCount: 0,
                recentInquiriesCountLast6Months: 0,
                oldestAccountAgeMonths: 0,
                totalRevolvingLimit: 0,
                totalRevolvingBalance: 0,
              },
            ],
    // Attach raw CRS issues data when available
    ...(crsData.issues ? { crsIssues: crsData.issues } : {}),
    existingLenderRelationships: Array.isArray(data.existingLenderRelationships)
      ? data.existingLenderRelationships
      : [],
    cegServicesEnrolled: Array.isArray(data.cegServicesEnrolled)
      ? data.cegServicesEnrolled
      : ["tradelines", "credit_repair", "income_coaching"],
  };
}

// ── Lenders ──────────────────────────────────────────────────────────
// NOTE: Reads from BANK_MANAGEMENT_COLLECTION ("bank-management") — the
// same collection used by service/bank-management.ts. The funding-playbook
// Lender type does NOT match the BankManagement schema (Lender expects
// primaryBureau, doubleDipRules, reconsiderationPhone, etc., while
// BankManagement has bankName, website, contacts, successFeePercentage).
export async function getLender(
  lenderId: string,
): Promise<Omit<Lender, "products">> {
  const snap = await db()
    .collection(BANK_MANAGEMENT_COLLECTION)
    .doc(lenderId)
    .get();
  if (!snap.exists) throw new NotFoundError("Lender", lenderId);
  const data = snap.data() as any;
  const name = data.displayName || data.bankName || snap.id;

  return {
    id: snap.id,
    type: "national_bank",
    primaryBureau: "Experian",
    secondaryBureau: null,
    bureauPullNotes: "Standard bureau pull for new credit applications.",
    doubleDipFriendly: true,
    doubleDipRules:
      "Apply for up to 2 products within 30 days to reuse the hard inquiry.",
    reconsiderationPhone: "1-800-555-0100",
    reconsiderationHours: "Mon-Fri 8am-8pm EST",
    reconsiderationTips:
      "Highlight total household income and length of credit history.",
    generalCustomerService: "1-800-555-0100",
    productPageBaseUrl: "https://example.com",
    commonDenialReasons: [
      "High revolving utilization",
      "Recent hard inquiries",
    ],
    lastVerifiedAt: new Date().toISOString(),
    ...data,
    displayName: name,
    placesSearchQuery: data.placesSearchQuery || `${name} bank branch`,
    bankingRelationshipRequirements: {
      strictnessLevel: "none",
      notes: "No prior banking relationship required.",
      ...(data.bankingRelationshipRequirements || {}),
    },
  };
}

// ── Products ─────────────────────────────────────────────────────────
// NOTE: Reads from BANK_PRODUCTS_COLLECTION ("bank-products") — the same
// flat collection used by service/bank-products.ts. Previously this used
// a subcollection (lenders/{lenderId}/products/{productId}); now it reads
// from the top-level bank-products collection by product ID directly.
// The funding-playbook Product type does NOT match the BankFormData schema
// (Product expects displayName, typicalApprovalRange, cegProductLift, etc.,
// while BankFormData has bankName, products[] array, underwritingNotes, etc.).
export async function getProduct(
  lenderId: string,
  productId: string,
): Promise<Product> {
  const snap = await db()
    .collection(BANK_PRODUCTS_COLLECTION)
    .doc(productId)
    .get();
  if (!snap.exists) throw new NotFoundError("Product", productId);
  const data = snap.data() as any;

  const firstSubProduct = data.products?.[0];
  const maxAmount = firstSubProduct?.maximumFundingAmount || 50000;

  return {
    id: snap.id,
    ...data,
    displayName:
      data.displayName ||
      firstSubProduct?.productName ||
      data.bankName ||
      "Funding Product",
    typicalApprovalRange:
      data.typicalApprovalRange &&
      Array.isArray(data.typicalApprovalRange) &&
      data.typicalApprovalRange.length >= 2
        ? data.typicalApprovalRange
        : [5000, maxAmount],
    denialReasons:
      data.denialReasons && Array.isArray(data.denialReasons)
        ? data.denialReasons
        : [
            "Inadequate credit history for requested limit",
            "High utilization on existing revolving accounts",
          ],
    reconsiderationSuccessRate: data.reconsiderationSuccessRate ?? 0.65,
    cegProductLift: data.cegProductLift ?? {
      tradelines: "+25 pts",
      creditRepair: "+40 pts",
      incomeCoaching: "+15%",
      businessFormation: "Required",
    },
  };
}

// ── Lender listing ───────────────────────────────────────────────────
export async function listLenders(): Promise<Array<Omit<Lender, "products">>> {
  const snap = await db().collection(BANK_MANAGEMENT_COLLECTION).get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lender, "id" | "products">),
  }));
}

// ── Product listing ──────────────────────────────────────────────────
// Filters BANK_PRODUCTS_COLLECTION by the bankId field matching lenderId.
export async function listProducts(lenderId: string): Promise<Product[]> {
  const snap = await db()
    .collection(BANK_PRODUCTS_COLLECTION)
    .where("bankId", "==", lenderId)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Product, "id">),
  }));
}

// ── Lender history (audit subcollection) ─────────────────────────────
// NOTE: Uses BANK_MANAGEMENT_COLLECTION as parent; the history subcollection
// is specific to the funding-playbook feature and has no service-layer analog.
export async function writeLenderHistoryEntry(
  entry: LenderHistoryEntry,
): Promise<void> {
  await db()
    .collection(BANK_MANAGEMENT_COLLECTION)
    .doc(entry.lenderId)
    .collection("history")
    .doc(entry.id)
    .set(entry);
}

// Playbooks (cache, 24h TTL)
export function playbookId(
  clientId: string,
  lenderId: string,
  productId: string,
): string {
  return `${clientId}_${lenderId}_${productId}`;
}

export async function getCachedPlaybook(id: string): Promise<Playbook | null> {
  const snap = await db().collection("playbooks").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as Playbook;
  const expiresAt = new Date(data.meta.expiresAt).getTime();
  if (Date.now() >= expiresAt) return null;
  return data;
}

export async function cachePlaybook(playbook: Playbook): Promise<void> {
  await db().collection("playbooks").doc(playbook.meta.id).set(playbook);
}

export async function savePlaybookFeedback(
  playbookId: string,
  feedback: Record<string, unknown>,
): Promise<string> {
  const ref = db()
    .collection("playbooks")
    .doc(playbookId)
    .collection("feedback")
    .doc();
  await ref.set({ id: ref.id, ...feedback });
  return ref.id;
}

// Branch cache (7 day TTL)
export function branchCacheId(zip: string, lenderId: string): string {
  return `${zip}_${lenderId}`;
}

export async function getCachedBranches(
  zip: string,
  lenderId: string,
): Promise<BranchCacheDoc | null> {
  const snap = await db()
    .collection("branches_cache")
    .doc(branchCacheId(zip, lenderId))
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as BranchCacheDoc;
  if (Date.now() >= new Date(data.expiresAt).getTime()) return null;
  return data;
}

export async function cacheBranches(doc: BranchCacheDoc): Promise<void> {
  await db()
    .collection("branches_cache")
    .doc(branchCacheId(doc.zip, doc.lenderId))
    .set(doc);
}

// Reconsideration script cache (24h TTL)
export function reconsiderationCacheId(
  clientId: string,
  lenderId: string,
  denialReason: string,
): string {
  const normalized = denialReason
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  return `${clientId}_${lenderId}_${normalized}`;
}

export async function getCachedReconsiderationScript(
  id: string,
): Promise<{ script: string; expiresAt: string } | null> {
  const snap = await db()
    .collection("reconsideration_scripts_cache")
    .doc(id)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as { script: string; expiresAt: string };
  if (Date.now() >= new Date(data.expiresAt).getTime()) return null;
  return data;
}

export async function cacheReconsiderationScript(
  id: string,
  script: string,
  ttlHours = 24,
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + ttlHours * 60 * 60 * 1000,
  ).toISOString();
  await db()
    .collection("reconsideration_scripts_cache")
    .doc(id)
    .set({ script, expiresAt, cachedAt: new Date().toISOString() });
}

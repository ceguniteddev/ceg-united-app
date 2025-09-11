import { useClientCRSReportQuery } from "@/hooks/crs";
import React, { useMemo } from "react";
// Drop this into your routes as the landing dashboard.
// Wire your actual hooks where indicated; the component also accepts optional props
// so you can server‑fetch and pass data down.

// ---------------- Types ----------------
type ISODate = string;
type NumericString = `${number}` | string;

type Bureau = "Experian" | "Equifax" | "TransUnion";

interface FundingMetrics {
  fundingApprovedLimits: number; // what each product/provider has given as an approved funding limit
  totalPendingAppsLimits: number; // sum of limits tied to applications still pending
  totalApprovedLimits: number; // total sum of approved limits (could equal or differ from fundingApprovedLimits)
}

interface PersonalMetrics {
  fullName?: string;
  lastMonthTotalDeposits?: number;
  avgMonthlyBalance?: number;
  verifiedMonthlyIncome?: number;
}

interface BusinessMetrics {
  businessName: string;
  accountBalance?: number;
  monthlyDeposits?: number;
  endingBalance?: number;
  businessCreditScore?: number;
  businessRiskRating?: string; // e.g., "Low", "Medium", "High"
  filingStatus?: "Active" | "Inactive";
}

interface HomeProps {
  funding?: FundingMetrics;
  personal?: PersonalMetrics;
  businesses?: BusinessMetrics[];
}

// ---------------- Credit report shapes (minimal) ----------------
interface ScoreFactor {
  scoreFactorText: string;
}
interface CreditScore {
  modelName: string;
  sourceType?: string; // bureau hint
  scoreValue?: NumericString;
  scoreMaximumValue?: NumericString;
  scoreFactors?: ScoreFactor[];
}
interface RequestData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
}
interface CreditReport {
  requestData?: RequestData;
  scores?: CreditScore[];
  creditFiles?: { creditFileDetail?: { sourceType?: string } }[];
}
interface CreditReportDoc {
  id: string;
  report: CreditReport;
  createdAt: ISODate;
}

// ---------------- Formatting helpers ----------------
const fmtMoney = (n?: number) =>
  typeof n === "number" && !isNaN(n)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

const safeNum = (v?: NumericString) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
};

const bureauLabel = (s?: string): Bureau | undefined => {
  const v = (s || "").toLowerCase();
  if (v.includes("experian")) return "Experian";
  if (v.includes("equifax")) return "Equifax";
  if (v.includes("trans")) return "TransUnion";
  return undefined;
};

// ---------------- UI atoms ----------------
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <div className={`rounded-2xl shadow-sm border border-neutral-200 bg-white ${className}`}>
    {children}
  </div>
);

const Metric: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <Card className="p-4">
    <div className="text-sm text-neutral-500">{label}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
    {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
  </Card>
);

const SectionTitle: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-3">
    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    {sub && <p className="text-sm text-neutral-500 mt-1">{sub}</p>}
  </div>
);

const ScoreCard: React.FC<{ bureau: Bureau; score?: CreditScore }> = ({ bureau, score }) => {
  const val = safeNum(score?.scoreValue);
  const max = safeNum(score?.scoreMaximumValue) ?? 850;
  const pct = val && max ? Math.min(100, Math.round((val / max) * 100)) : 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">{bureau}</div>
          <div className="text-3xl font-bold mt-1">{val ?? "—"}</div>
        </div>
        <div className="w-28">
          <div className="h-2 w-full rounded bg-neutral-100 overflow-hidden">
            <div className="h-2 rounded bg-black" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {val ? `${pct}% of max` : "No score"}
          </div>
        </div>
      </div>
      {score?.modelName && <div className="text-xs text-neutral-500 mt-2">{score.modelName}</div>}
    </Card>
  );
};

// ---------------- Data adapters ----------------
function groupCRSDocsByBureau(
  docs?: CreditReportDoc[] | null
): Partial<Record<Bureau, CreditReportDoc>> {
  const out: Partial<Record<Bureau, CreditReportDoc>> = {};
  if (!docs) return out;
  for (const d of docs) {
    const hint =
      d.report.scores?.[0]?.sourceType || d.report.creditFiles?.[0]?.creditFileDetail?.sourceType;
    const b = bureauLabel(hint);
    if (!b) continue;
    const prev = out[b];
    if (!prev || new Date(d.createdAt) >= new Date(prev.createdAt)) out[b] = d;
  }
  return out;
}

function extractClientName(docs?: CreditReportDoc[] | null, fallback?: string): string | undefined {
  if (docs && docs.length) {
    // Prefer the most recent doc's requestData
    const latest = [...docs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
    const r = latest.report.requestData;
    if (r) {
      const parts = [r.firstName, r.middleName, r.lastName, r.suffix].filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
  }
  return fallback;
}

// ---------------- Main page ----------------
const HomeDashboard: React.FC<HomeProps> = ({ funding, personal, businesses }) => {
  // Pull CRS docs, if your app already has the hook available.
  // Replace dynamic require with a real import in your codebase.
  let crsReportDocs: CreditReportDoc[] | null | undefined = undefined;
  let isLoadingCRS = false;
  try {
    const q = useClientCRSReportQuery();
    crsReportDocs = q?.crsReport as CreditReportDoc[] | null;
    isLoadingCRS = q?.isLoading;
  } catch {}

  const bureaus = useMemo(() => groupCRSDocsByBureau(crsReportDocs), [crsReportDocs]);
  const scores: Partial<Record<Bureau, CreditScore | undefined>> = useMemo(
    () => ({
      Experian: bureaus.Experian?.report.scores?.[0],
      Equifax: bureaus.Equifax?.report.scores?.[0],
      TransUnion: bureaus.TransUnion?.report.scores?.[0],
    }),
    [bureaus]
  );

  const clientName = useMemo(
    () => extractClientName(crsReportDocs, personal?.fullName),
    [crsReportDocs, personal?.fullName]
  );

  // Safe business list
  const bizList: BusinessMetrics[] = businesses ?? [];

  return (
    <div className="mx-auto max-w-7xl p-6 bg-neutral-50 min-h-screen">
      {/* Top banner metrics */}
      <SectionTitle title="Home" sub="Snapshot of your personal and business finances" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric label="Funding approved limits" value={fmtMoney(funding?.fundingApprovedLimits)} />
        <Metric
          label="Total pending apps limits"
          value={fmtMoney(funding?.totalPendingAppsLimits)}
        />
        <Metric label="Total approved limits" value={fmtMoney(funding?.totalApprovedLimits)} />
      </div>

      {/* Identity + personal metrics */}
      <Card className="p-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <div className="text-sm text-neutral-500">Client</div>
            <div className="text-2xl font-semibold mt-1">{clientName ?? "—"}</div>
          </div>
          <div>
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <Metric
                  label="Last month total deposits (personal)"
                  value={fmtMoney(personal?.lastMonthTotalDeposits)}
                />
                <Metric
                  label="Average monthly balance (personal)"
                  value={fmtMoney(personal?.avgMonthlyBalance)}
                />
                <Metric
                  label="Monthly verified income (personal)"
                  value={fmtMoney(personal?.verifiedMonthlyIncome)}
                />
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="text-sm text-neutral-500">Credit scores</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <ScoreCard bureau="Experian" score={scores.Experian} />
                <ScoreCard bureau="Equifax" score={scores.Equifax} />
                <ScoreCard bureau="TransUnion" score={scores.TransUnion} />
              </div>
              {isLoadingCRS && (
                <div className="text-xs text-neutral-500 mt-2">Loading credit data…</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Businesses */}
      <SectionTitle
        title="Businesses"
        sub={bizList.length ? undefined : "No business profiles provided."}
      />
      <div className="space-y-6">
        {bizList.length === 0 ? (
          <Card className="p-6 text-neutral-500 text-sm">
            Add a business to see balances, deposits, risk, and scores.
          </Card>
        ) : (
          bizList.map((b, idx) => (
            <Card key={`${b.businessName}-${idx}`} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{b.businessName || `Business ${idx + 1}`}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full border ${
                    b.filingStatus === "Active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : b.filingStatus === "Inactive"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200"
                  }`}
                >
                  {b.filingStatus ?? "—"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Metric label="Business account balance" value={fmtMoney(b.accountBalance)} />
                <Metric label="Business monthly deposits" value={fmtMoney(b.monthlyDeposits)} />
                <Metric label="Business ending balance" value={fmtMoney(b.endingBalance)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Metric label="Business credit score" value={b.businessCreditScore ?? "—"} />
                <Metric label="Business risk rating" value={b.businessRiskRating ?? "—"} />
                <div />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeDashboard;

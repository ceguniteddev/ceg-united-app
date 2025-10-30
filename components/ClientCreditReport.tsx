"use client";
import NoBankLinked from "@/components/NoBankLinked";
import Spinner from "@/components/Spinner";
import { useClientCRSReportQuery } from "@/hooks/crs";
import { useAuth } from "@/provider/AuthContext";
import {
  CreditReport,
  CreditReportWithId,
  CreditScore,
  Inquiry,
  ISODate,
  NumericString,
  Tradeline,
} from "@/types/crs";
import React, { useMemo } from "react";
import { EmptyState } from "./EmptyState";

// --- Utilities ---
const toNum = (v?: NumericString) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
};

const maskId = (id: string) =>
  id.length <= 4
    ? id
    : `${"•".repeat(Math.max(0, id.length - 4))}${id.slice(-4)}`;

const fmtCurrency = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const daysBetween = (a?: ISODate | string, b = new Date()): number => {
  if (!a) return NaN;
  const d = new Date(a);
  return Math.round((Number(b) - Number(d)) / (1000 * 60 * 60 * 24));
};

function computeUtilization(tradelines: Tradeline[]) {
  const revolvingOpen = tradelines.filter(
    (t) =>
      t.accountType?.toLowerCase() === "revolving" &&
      t.accountStatusType?.toLowerCase() === "open"
  );
  const totalLimit = revolvingOpen.reduce(
    (s, t) => s + toNum(t.creditLimitAmount),
    0
  );
  const totalBal = revolvingOpen.reduce(
    (s, t) => s + toNum(t.currentBalanceAmount),
    0
  );
  const pct = totalLimit > 0 ? (totalBal / totalLimit) * 100 : 0;
  return { totalLimit, totalBal, pct };
}

function getNegativeItems(tradelines: Tradeline[]) {
  return tradelines.filter((t) => {
    const late30 = toNum(t._30DayLates) > 0;
    const late60 = toNum(t._60DayLates) > 0;
    const late90 = toNum(t._90DayLates) > 0;
    return Boolean(t.derogatoryDataIndicator) || late30 || late60 || late90;
  });
}

function getPositiveFactors(tradelines: Tradeline[], scores: CreditScore[]) {
  const open = tradelines.filter(
    (t) => t.accountStatusType?.toLowerCase() === "open"
  );
  const paidClosed = tradelines.filter((t) =>
    ["paid", "closed", "transferred"].includes(
      t.accountStatusType?.toLowerCase() || ""
    )
  );
  const onTime = tradelines.filter(
    (t) =>
      toNum(t._30DayLates) + toNum(t._60DayLates) + toNum(t._90DayLates) === 0
  );
  const mixHasInstallment = tradelines.some(
    (t) =>
      t.accountType?.toLowerCase() === "installment" ||
      t.accountType?.toLowerCase() === "mortgage"
  );
  const mixHasRevolving = tradelines.some(
    (t) =>
      t.accountType?.toLowerCase() === "revolving" ||
      t.accountType?.toLowerCase() === "chargeaccount"
  );
  const oldestOpenDate = tradelines.reduce<ISODate | undefined>((min, t) => {
    if (!t.accountOpenedDate) return min;
    return !min || new Date(t.accountOpenedDate) < new Date(min)
      ? t.accountOpenedDate
      : min;
  }, undefined);
  const daysOld = daysBetween(oldestOpenDate);

  const positives: string[] = [];
  if (open.length > 0)
    positives.push(
      `${open.length} open account${
        open.length > 1 ? "s" : ""
      } reporting as agreed`
    );
  if (paidClosed.length > 0)
    positives.push(
      `${paidClosed.length} account${
        paidClosed.length > 1 ? "s" : ""
      } paid/closed in good standing`
    );
  if (onTime.length >= Math.ceil(tradelines.length * 0.75))
    positives.push("Strong on‑time payment history on most accounts");
  if (mixHasInstallment && mixHasRevolving)
    positives.push("Healthy mix of revolving and installment credit");
  if (!tradelines.some((t) => toNum(t._90DayLates) > 0))
    positives.push("No 90‑day delinquencies reported");
  if (daysOld && !isNaN(daysOld)) {
    const years = Math.floor(daysOld / 365);
    if (years >= 5)
      positives.push(
        `Established credit history (~${years} years since oldest account)`
      );
  }
  const sfTexts = (scores?.[0]?.scoreFactors || []).map((f) =>
    f.scoreFactorText.toLowerCase()
  );
  if (
    !sfTexts.some((t: string) => t.includes("lack of recent installment")) &&
    mixHasInstallment
  )
    positives.push("Recent installment activity present");

  return Array.from(new Set(positives));
}

function bureauLabel(sourceType?: string) {
  const s = (sourceType || "").toLowerCase();
  if (s.includes("experian")) return "Experian";
  if (s.includes("equifax")) return "Equifax";
  if (s.includes("trans")) return "TransUnion";
  return sourceType || "Unknown";
}

// Determine bureau for a given report
function detectBureau(
  report: CreditReport
): "Experian" | "TransUnion" | "Equifax" | null {
  const fromScore = report.scores?.[0]?.sourceType;
  if (fromScore) return bureauLabel(fromScore) as any;
  const fromFile = report.creditFiles?.[0]?.creditFileDetail?.sourceType;
  if (fromFile) return bureauLabel(fromFile) as any;
  const r = report.repositoryIncluded;
  if (r) {
    const truths = [
      r.experian ? "Experian" : null,
      r.transunion ? "TransUnion" : null,
      r.equifax ? "Equifax" : null,
    ].filter(Boolean) as ("Experian" | "TransUnion" | "Equifax")[];
    if (truths.length === 1) return truths[0];
  }
  return null;
}

// Keep the latest doc per bureau by createdAt
function groupByBureau(docs?: CreditReportWithId[] | null) {
  const out: Record<
    "Experian" | "TransUnion" | "Equifax",
    CreditReportWithId | null
  > = {
    Experian: null,
    TransUnion: null,
    Equifax: null,
  };
  if (!docs) return out;
  for (const d of docs) {
    const bureau = d?.report ? detectBureau(d.report) : null;
    if (!bureau) continue;
    const prev = out[bureau];
    if (!prev) out[bureau] = d;
    else {
      const prevTs = new Date(prev.createdAt).getTime();
      const curTs = new Date(d.createdAt).getTime();
      if (curTs >= prevTs) out[bureau] = d;
    }
  }
  return out;
}

// --- UI primitives ---
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <div
    className={`rounded-2xl shadow-sm border border-neutral-200 bg-white ${className}`}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; sub?: string }> = ({
  title,
  sub,
}) => (
  <div className="mb-4">
    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    {sub && <p className="text-sm text-neutral-500 mt-1">{sub}</p>}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700 border border-neutral-200">
    {children}
  </span>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-neutral-500 text-sm py-6 text-center">{children}</div>
);

const ScoreCard: React.FC<{
  bureau: "Experian" | "Equifax" | "TransUnion";
  score?: CreditScore;
}> = ({ bureau, score }) => {
  const value = score?.scoreValue ? Number(score.scoreValue) : undefined;
  const max = score?.scoreMaximumValue ? Number(score.scoreMaximumValue) : 850;
  const pct = value && max ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">{bureau}</div>
          <div className="text-3xl font-bold mt-1">{value ?? "—"}</div>
        </div>
        <div className="w-28">
          <div className="h-2 w-full rounded bg-neutral-100 overflow-hidden">
            <div
              className="h-2 rounded bg-black"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {value ? `${pct}% of max` : "No score"}
          </div>
        </div>
      </div>
      {score?.modelName && (
        <div className="text-xs text-neutral-500 mt-2">{score.modelName}</div>
      )}
    </Card>
  );
};

type Props = {
  userId: string;
  isAdminView?: boolean;
};

// --- Main Page ---
const ClientCreditReport = ({ userId, isAdminView }: Props) => {
  const { crsReport, isLoading } = useClientCRSReportQuery({ userId });

  const bureauMap = useMemo(() => groupByBureau(crsReport || []), [crsReport]);

  // Scores per bureau
  const scoresByBureau: Record<
    "Experian" | "TransUnion" | "Equifax",
    CreditScore | undefined
  > = {
    Experian: bureauMap.Experian?.report.scores?.[0],
    TransUnion: bureauMap.TransUnion?.report.scores?.[0],
    Equifax: bureauMap.Equifax?.report.scores?.[0],
  };

  // Inquiries per bureau (default to empty array if not present)
  const inquiriesByBureau: Record<
    "Experian" | "TransUnion" | "Equifax",
    Inquiry[]
  > = {
    Experian: bureauMap.Experian?.report.inquiries ?? [],
    TransUnion: bureauMap.TransUnion?.report.inquiries ?? [],
    Equifax: bureauMap.Equifax?.report.inquiries ?? [],
  };

  // Aggregate tradelines across all bureaus
  const allTradelines: Tradeline[] = useMemo(
    () => [
      ...(bureauMap.Experian?.report.tradelines ?? []),
      ...(bureauMap.TransUnion?.report.tradelines ?? []),
      ...(bureauMap.Equifax?.report.tradelines ?? []),
    ],
    [bureauMap]
  );

  const negItems = useMemo(
    () => getNegativeItems(allTradelines),
    [allTradelines]
  );
  const positives = useMemo(
    () =>
      getPositiveFactors(allTradelines, [
        ...(bureauMap.Experian?.report.scores ?? []),
        ...(bureauMap.TransUnion?.report.scores ?? []),
        ...(bureauMap.Equifax?.report.scores ?? []),
      ]),
    [allTradelines, bureauMap]
  );
  const util = useMemo(
    () => computeUtilization(allTradelines),
    [allTradelines]
  );

  // Pull a friendly timestamp: max of responseDetail.dateRequested across bureaus, else latest createdAt.
  const pulledAt = useMemo(() => {
    const dates: number[] = [];
    [bureauMap.Experian, bureauMap.TransUnion, bureauMap.Equifax].forEach(
      (doc) => {
        const dr = doc?.report.responseDetail?.dateRequested;
        if (dr) dates.push(new Date(dr).getTime());
        if (doc?.createdAt) dates.push(new Date(doc.createdAt).getTime());
      }
    );
    if (dates.length === 0) return undefined;
    return new Date(Math.max(...dates)).toLocaleString();
  }, [bureauMap]);

  if (isLoading) {
    return <Spinner displayText="Loading credit reports..." />;
  }

  const hasAnyReport = Boolean(
    bureauMap.Experian || bureauMap.TransUnion || bureauMap.Equifax
  );
  if (!hasAnyReport) {
    return (
      <EmptyState
        title="No Credit Report"
        description="We couldn't find Experian, Equifax, or TransUnion data yet."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 bg-neutral-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Credit</h1>
        {pulledAt && (
          <p className="text-neutral-600 text-sm mt-1">Pulled {pulledAt}</p>
        )}
      </header>

      {/* Scores */}
      <SectionTitle
        title="Credit Scores"
        sub="Across Experian, Equifax, and TransUnion"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <ScoreCard bureau="Experian" score={scoresByBureau.Experian} />
        <ScoreCard bureau="Equifax" score={scoresByBureau.Equifax} />
        <ScoreCard bureau="TransUnion" score={scoresByBureau.TransUnion} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card className="p-4">
          <div className="text-sm text-neutral-500">
            Total Open Revolving Utilization
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {util.pct.toFixed(0)}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {fmtCurrency(util.totalBal)} / {fmtCurrency(util.totalLimit)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-neutral-500">Open Accounts</div>
          <div className="mt-1 text-2xl font-semibold">
            {
              allTradelines.filter(
                (t) => t.accountStatusType?.toLowerCase() === "open"
              ).length
            }
          </div>
          <div className="text-xs text-neutral-500 mt-1">{`Reporting with status "Open"`}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-neutral-500">Negative Items</div>
          <div className="mt-1 text-2xl font-semibold">{negItems.length}</div>
          <div className="text-xs text-neutral-500 mt-1">
            Derogatory flags or late payments
          </div>
        </Card>
      </div>

      {/* Inquiries per bureau */}
      <SectionTitle
        title="Inquiries by Bureau"
        sub="Each hard inquiry listed per bureau"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {(["Experian", "Equifax", "TransUnion"] as const).map((b) => (
          <Card key={b} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">{b}</div>
              <Badge>
                {inquiriesByBureau[b].length} inquiry
                {inquiriesByBureau[b].length !== 1 ? "ies" : ""}
              </Badge>
            </div>
            {inquiriesByBureau[b].length === 0 ? (
              <Empty>No inquiries present for {b}.</Empty>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                {inquiriesByBureau[b].map((q, i) => (
                  <li
                    key={`${q.creditorName}-${q.inquiryDate}-${i}`}
                    className="text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate mr-2">
                        {q.creditorName || "Unknown"}
                        {q.businessType ? ` · ${q.businessType}` : ""}
                      </span>
                      <span className="text-neutral-500 text-xs">
                        {q.inquiryDate
                          ? new Date(q.inquiryDate).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    {q.subscriberCode && (
                      <div className="text-[11px] text-neutral-500">
                        Code: {q.subscriberCode}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      {/* Negative items */}
      <SectionTitle
        title="Negative Items"
        sub="Accounts with derogatories or any reported late payments (all bureaus)"
      />
      <Card className="overflow-hidden  mb-10">
        {negItems.length === 0 ? (
          <Empty>
            No negative items detected from the provided tradelines.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Bureau</th>
                  <th className="text-left px-4 py-2 font-medium">Creditor</th>
                  <th className="text-left px-4 py-2 font-medium">Acct #</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">
                    Late 30/60/90
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    Current Balance
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {negItems.map((t, i) => (
                  <tr
                    key={`${t.sourceType}-${t.accountIdentifier}-${i}`}
                    className="border-t"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      {bureauLabel(t.sourceType)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {t.creditorName || "—"}
                    </td>
                    <td className="px-4 py-2">{maskId(t.accountIdentifier)}</td>
                    <td className="px-4 py-2">
                      {t.accountStatusType || "—"}
                      {t.derogatoryDataIndicator ? " · Derogatory" : ""}
                    </td>
                    <td className="px-4 py-2">
                      {toNum(t._30DayLates)}/{toNum(t._60DayLates)}/
                      {toNum(t._90DayLates)}
                    </td>
                    <td className="px-4 py-2">
                      {fmtCurrency(toNum(t.currentBalanceAmount))}
                    </td>
                    <td className="px-4 py-2">
                      {t.lastActivityDate
                        ? new Date(t.lastActivityDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Positive factors */}
      <SectionTitle
        title="Positive Factors"
        sub="Strengths inferred from the combined tradelines and score context"
      />
      <Card className="p-4 mb-10">
        {positives.length === 0 ? (
          <Empty>
            No explicit positive factors detected. Provide more bureau data for
            a fuller picture.
          </Empty>
        ) : (
          <ul className="list-disc pl-5 space-y-2 text-sm">
            {positives.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Call to action */}
      {!isAdminView && false && (
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">
              Need help improving your credit?
            </div>
            <div className="text-neutral-600 text-sm mt-1">
              Tap the button to start credit repair with Rapid Repair Now.
            </div>
          </div>
          <a
            href="https://rapidrepairnow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-neutral-900 hover:bg-neutral-900 hover:text-white transition"
            aria-label="Fix my credit at Rapid Repair Now"
          >
            Fix my credit
          </a>
        </Card>
      )}

      <p className="text-xs text-neutral-500 mt-4">
        Note: When multiple docs per bureau exist, the newest is used.
      </p>
    </div>
  );
};

export default ClientCreditReport;

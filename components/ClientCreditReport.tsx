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
  ResponseAlertMessage,
  Tradeline,
} from "@/types/crs";
import React, { useMemo, useState } from "react";
import EmptyState from "./EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  <div className="mb-3 sm:mb-4">
    <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
    {sub && <p className="text-xs sm:text-sm text-neutral-500 mt-1">{sub}</p>}
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
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs sm:text-sm text-neutral-500">{bureau}</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {value ?? "—"}
          </div>
        </div>
        <div className="w-20 sm:w-28">
          <div className="h-1.5 sm:h-2 w-full rounded bg-neutral-100 overflow-hidden">
            <div
              className="h-1.5 sm:h-2 rounded bg-black"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-1">
            {value ? `${pct}% of max` : "No score"}
          </div>
        </div>
      </div>
      {score?.modelName && (
        <div className="text-[10px] sm:text-xs text-neutral-500 mt-2">
          {score.modelName}
        </div>
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

  // Group reports by createdAt timestamp (only for bureau reports)
  const reportsByTimestamp = useMemo(() => {
    if (!crsReport) return {};
    const grouped: Record<string, CreditReportWithId[]> = {};
    crsReport.forEach((doc: CreditReportWithId) => {
      // Only include Equifax, Experian, and TransUnion reports
      if (
        doc.createdAt &&
        doc.type &&
        ["equifax", "experian", "transunion"].includes(doc.type.toLowerCase())
      ) {
        const dateKey = new Date(doc.createdAt).toDateString();

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(doc);
      }
    });
    return grouped;
  }, [crsReport]);

  // Get sorted timestamps (most recent first)
  const timestamps = useMemo(
    () =>
      Array.from(new Set(Object.keys(reportsByTimestamp))).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      ),
    [reportsByTimestamp]
  );

  // State for selected timestamp (default to most recent)
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>("");

  // Set initial timestamp when data loads
  React.useEffect(() => {
    if (timestamps.length > 0 && !selectedTimestamp) {
      setSelectedTimestamp(timestamps[0]);
    }
  }, [timestamps, selectedTimestamp]);

  // Get reports for selected timestamp
  const selectedReports = useMemo(
    () =>
      selectedTimestamp ? reportsByTimestamp[selectedTimestamp] || [] : [],
    [selectedTimestamp, reportsByTimestamp]
  );

  const bureauMap = useMemo(
    () => groupByBureau(selectedReports),
    [selectedReports]
  );

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

  // Tradelines per bureau
  const tradelinesByBureau: Record<
    "Experian" | "TransUnion" | "Equifax",
    Tradeline[]
  > = {
    Experian: bureauMap.Experian?.report.tradelines ?? [],
    TransUnion: bureauMap.TransUnion?.report.tradelines ?? [],
    Equifax: bureauMap.Equifax?.report.tradelines ?? [],
  };

  // Alert messages across all bureaus
  const allAlertMessages: ResponseAlertMessage[] = useMemo(
    () => [
      ...(bureauMap.Experian?.report.responseAlertMessages ?? []),
      ...(bureauMap.TransUnion?.report.responseAlertMessages ?? []),
      ...(bureauMap.Equifax?.report.responseAlertMessages ?? []),
    ],
    [bureauMap]
  );

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
    <div className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6 bg-neutral-50 min-h-screen">
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              My Credit
            </h1>
            {pulledAt && (
              <p className="text-neutral-600 text-sm mt-1">Pulled {pulledAt}</p>
            )}
          </div>
          {timestamps.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600 whitespace-nowrap">
                Report Date:
              </label>
              <Select
                value={selectedTimestamp}
                onValueChange={setSelectedTimestamp}
              >
                <SelectTrigger className="w-[200px] sm:w-[240px]">
                  <SelectValue placeholder="Select report date" />
                </SelectTrigger>
                <SelectContent>
                  {timestamps.map((timestamp) => (
                    <SelectItem key={timestamp} value={timestamp}>
                      {new Date(timestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* Scores */}
      <SectionTitle
        title="Credit Scores"
        sub="Across Experian, Equifax, and TransUnion"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <ScoreCard bureau="Experian" score={scoresByBureau.Experian} />
        <ScoreCard bureau="Equifax" score={scoresByBureau.Equifax} />
        <ScoreCard bureau="TransUnion" score={scoresByBureau.TransUnion} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
        <Card className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-neutral-500">
            Total Open Revolving Utilization
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold">
            {util.pct.toFixed(0)}%
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">
            {fmtCurrency(util.totalBal)} / {fmtCurrency(util.totalLimit)}
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-neutral-500">
            Open Accounts
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold">
            {
              allTradelines.filter(
                (t) => t.accountStatusType?.toLowerCase() === "open"
              ).length
            }
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">{`Reporting with status "Open"`}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-neutral-500">
            Negative Items
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold">
            {negItems.length}
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">
            Derogatory flags or late payments
          </div>
        </Card>
      </div>

      {/* Alert Messages */}
      {allAlertMessages.length > 0 && (
        <>
          <SectionTitle
            title="Alert Messages"
            sub="Important alerts and notifications from credit bureaus"
          />
          <Card className="p-3 sm:p-4 mb-6 sm:mb-10">
            <div className="space-y-3">
              {allAlertMessages.map((alert, i) => (
                <div
                  key={i}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="w-5 h-5 text-amber-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-amber-900">
                          {bureauLabel(alert.sourceType)}
                        </span>
                        {alert.responseAlertMessageCategoryType && (
                          <Badge>
                            {alert.responseAlertMessageCategoryType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-amber-800">
                        {alert.responseAlertMessageText}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Inquiries per bureau */}
      <SectionTitle
        title="Inquiries by Bureau"
        sub="Each hard inquiry listed per bureau"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
        {(["Experian", "Equifax", "TransUnion"] as const).map((b) => (
          <Card key={b} className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-sm sm:text-base font-medium">{b}</div>
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
                      <span className="truncate flex-1 min-w-0">
                        {q.creditorName || "Unknown"}
                        {q.businessType ? ` · ${q.businessType}` : ""}
                      </span>
                      <span className="text-neutral-500 text-[10px] sm:text-xs flex-shrink-0">
                        {q.inquiryDate
                          ? new Date(q.inquiryDate).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    {q.subscriberCode && (
                      <div className="text-[10px] sm:text-[11px] text-neutral-500">
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

      {/* Tradelines by Bureau */}
      <SectionTitle
        title="Credit"
        sub="Credit account information from each bureau"
      />
      <div className="space-y-6 mb-6 sm:mb-10">
        {(["Experian", "Equifax", "TransUnion"] as const).map((bureau) => (
          <div key={bureau}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold">{bureau}</h3>
              <Badge>
                {tradelinesByBureau[bureau].length} account
                {tradelinesByBureau[bureau].length !== 1 ? "s" : ""}
              </Badge>
            </div>
            {tradelinesByBureau[bureau].length === 0 ? (
              <Card className="p-4">
                <Empty>No accounts present for {bureau}.</Empty>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto -mx-1 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-[10px] sm:text-xs">
                      <thead className="bg-neutral-100 border-b-2 border-neutral-300">
                        <tr>
                          <th className="text-left px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>E</div>
                            <div>C</div>
                            <div>O</div>
                            <div>A</div>
                          </th>
                          <th className="text-left px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide min-w-[120px]">
                            Creditor
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>Date</div>
                            <div>Reported</div>
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>Date</div>
                            <div>Opened</div>
                            <div className="font-normal">DLA</div>
                          </th>
                          <th className="text-right px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>High Credit</div>
                            <div>or Limit</div>
                            <div className="font-normal">Acct Type</div>
                          </th>
                          <th className="text-right px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>Balance</div>
                            <div className="font-normal">Terms</div>
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>Past</div>
                            <div>Due</div>
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            <div>Mo</div>
                            <div>Rev</div>
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            30
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            60
                          </th>
                          <th className="text-center px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                            90+
                          </th>
                          <th className="text-left px-2 py-2 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide min-w-[100px]">
                            <div>Status</div>
                            <div className="font-normal">Source</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradelinesByBureau[bureau].map((t, i) => {
                          const acctOwnershipCode =
                            t.accountOwnershipType?.charAt(0).toUpperCase() ||
                            "-";
                          return (
                            <React.Fragment key={`${t.accountIdentifier}-${i}`}>
                              <tr className="border-b hover:bg-neutral-50">
                                {/* ECOA Column */}
                                <td className="px-2 py-2 text-center align-top font-medium">
                                  {acctOwnershipCode}
                                </td>

                                {/* Creditor Column */}
                                <td className="px-2 py-2 align-top">
                                  <div className="font-semibold">
                                    {t.creditorName || "Unknown"}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                    {t.accountIdentifier}
                                  </div>
                                </td>

                                {/* Date Reported Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div>
                                    {t.accountReportedDate
                                      ? new Date(
                                          t.accountReportedDate
                                        ).toLocaleDateString("en-US", {
                                          month: "2-digit",
                                          year: "2-digit",
                                        })
                                      : "-"}
                                  </div>
                                </td>

                                {/* Date Opened / DLA Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div>
                                    {t.accountOpenedDate
                                      ? new Date(
                                          t.accountOpenedDate
                                        ).toLocaleDateString("en-US", {
                                          month: "2-digit",
                                          year: "2-digit",
                                        })
                                      : "-"}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 mt-1">
                                    {t.lastActivityDate
                                      ? new Date(
                                          t.lastActivityDate
                                        ).toLocaleDateString("en-US", {
                                          month: "2-digit",
                                          year: "2-digit",
                                        })
                                      : "--/--"}
                                  </div>
                                </td>

                                {/* High Credit/Limit Column */}
                                <td className="px-2 py-2 text-right align-top">
                                  <div className="font-semibold">
                                    {t.creditLimitAmount
                                      ? `$${toNum(t.creditLimitAmount)}`
                                      : t.highBalanceAmount
                                      ? `$${toNum(t.highBalanceAmount)}`
                                      : "-"}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 mt-1">
                                    {t.accountType || "-"}
                                  </div>
                                </td>

                                {/* Balance Column */}
                                <td className="px-2 py-2 text-right align-top">
                                  <div className="font-semibold">
                                    {t.currentBalanceAmount
                                      ? `$${toNum(t.currentBalanceAmount)}`
                                      : "-"}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 mt-1">
                                    {t.monthlyPaymentAmount
                                      ? `$${toNum(t.monthlyPaymentAmount)}`
                                      : "-"}
                                  </div>
                                </td>

                                {/* Past Due Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div>
                                    {t.pastDueAmount &&
                                    toNum(t.pastDueAmount) > 0
                                      ? `$${toNum(t.pastDueAmount)}`
                                      : "-"}
                                  </div>
                                </td>

                                {/* Mo Rev Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div>{t.monthsReviewedCount || "-"}</div>
                                </td>

                                {/* 30 Days Late Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div
                                    className={
                                      toNum(t._30DayLates) > 0
                                        ? "text-red-600 font-semibold"
                                        : ""
                                    }
                                  >
                                    {toNum(t._30DayLates)}
                                  </div>
                                </td>

                                {/* 60 Days Late Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div
                                    className={
                                      toNum(t._60DayLates) > 0
                                        ? "text-red-600 font-semibold"
                                        : ""
                                    }
                                  >
                                    {toNum(t._60DayLates)}
                                  </div>
                                </td>

                                {/* 90+ Days Late Column */}
                                <td className="px-2 py-2 text-center align-top">
                                  <div
                                    className={
                                      toNum(t._90DayLates) > 0
                                        ? "text-red-600 font-semibold"
                                        : ""
                                    }
                                  >
                                    {toNum(t._90DayLates)}
                                  </div>
                                </td>

                                {/* Status Column */}
                                <td className="px-2 py-2 align-top">
                                  <div className="font-medium">
                                    {t.currentRatingType || "AS AGREED"}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 mt-0.5">
                                    {bureauLabel(t.sourceType)
                                      ?.toUpperCase()
                                      .slice(0, 3)}
                                  </div>
                                </td>
                              </tr>

                              {/* Additional Row for Original Creditor / Comments */}
                              {(t.originalCreditorName ||
                                (t.comments && t.comments.length > 0)) && (
                                <tr className="border-b bg-blue-50">
                                  <td></td>
                                  <td
                                    colSpan={11}
                                    className="px-2 py-2 text-[9px] sm:text-[10px]"
                                  >
                                    {t.originalCreditorName && (
                                      <div className="text-blue-700 font-medium uppercase">
                                        ORIGINAL CREDITOR:{" "}
                                        {t.originalCreditorName}
                                      </div>
                                    )}
                                    {t.comments && t.comments.length > 0 && (
                                      <div className="text-neutral-700 mt-1">
                                        {t.comments.map((comment, idx) => (
                                          <div key={idx}>
                                            {comment.commentText}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* Negative items */}
      <SectionTitle
        title="Negative Items"
        sub="Accounts with derogatories or any reported late payments (all bureaus)"
      />
      <Card className="overflow-hidden mb-6 sm:mb-10">
        {negItems.length === 0 ? (
          <Empty>
            No negative items detected from the provided tradelines.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
                      Bureau
                    </th>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
                      Creditor
                    </th>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
                      Acct #
                    </th>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
                      Status
                    </th>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
                      Late 30/60/90
                    </th>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
                      Current Balance
                    </th>
                    <th className="text-left px-2 sm:px-4 py-2 font-medium text-[10px] sm:text-xs">
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
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs">
                        {bureauLabel(t.sourceType)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs">
                        {t.creditorName || "—"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs">
                        {maskId(t.accountIdentifier)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs">
                        {t.accountStatusType || "—"}
                        {t.derogatoryDataIndicator ? " · Derogatory" : ""}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs">
                        {toNum(t._30DayLates)}/{toNum(t._60DayLates)}/
                        {toNum(t._90DayLates)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs">
                        {fmtCurrency(toNum(t.currentBalanceAmount))}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs">
                        {t.lastActivityDate
                          ? new Date(t.lastActivityDate).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Positive factors */}
      <SectionTitle
        title="Positive Factors"
        sub="Strengths inferred from the combined tradelines and score context"
      />
      <Card className="p-3 sm:p-4 mb-6 sm:mb-10">
        {positives.length === 0 ? (
          <Empty>
            No explicit positive factors detected. Provide more bureau data for
            a fuller picture.
          </Empty>
        ) : (
          <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            {positives.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Call to action */}
      {!isAdminView && false && (
        <Card className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
          <div className="flex-1">
            <div className="text-base sm:text-lg font-semibold">
              Need help improving your credit?
            </div>
            <div className="text-neutral-600 text-xs sm:text-sm mt-1">
              Tap the button to start credit repair with Rapid Repair Now.
            </div>
          </div>
          <a
            href="https://rapidrepairnow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-neutral-900 hover:bg-neutral-900 hover:text-white transition w-full sm:w-auto justify-center text-sm sm:text-base"
            aria-label="Fix my credit at Rapid Repair Now"
          >
            Fix my credit
          </a>
        </Card>
      )}

      <p className="text-[10px] sm:text-xs text-neutral-500 mt-3 sm:mt-4">
        Note: When multiple docs per bureau exist, the newest is used.
      </p>
    </div>
  );
};

export default ClientCreditReport;

"use client";
import Spinner from "@/components/Spinner";
import { checkFreePullEligibility } from "@/lib/crs-eligibility";
import { useClientCRSReportQuery } from "@/hooks/crs";
import { useCountUp } from "@/hooks/useCountUp";
import { useQueryClient } from "@tanstack/react-query";
import { useUserQuery } from "@/hooks/user";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import {
  GET_USER,
  GET_USER_CRS_REPORT,
  GET_WALLET,
} from "@/constant/react-query-keys";
import { useWalletQuery, useSpendFundsMutation } from "@/hooks/wallet";
import { TopUpModal } from "@/components/wallet/TopUpModal";
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
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileCheck,
  Info,
  ReceiptIcon,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import EmptyState from "./EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initiateCRSReportCheckout, generateCRSReport } from "@/service/crs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { UserWithId } from "@/schema/registration";
import { ConfirmButton } from "@/components/Confirmation";
import { useFeeSettings } from "@/hooks/fee-settings";
import { useMembership } from "@/hooks/membership";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

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
      t.accountStatusType?.toLowerCase() === "open",
  );
  const totalLimit = revolvingOpen.reduce(
    (s, t) => s + toNum(t.creditLimitAmount),
    0,
  );
  const totalBal = revolvingOpen.reduce(
    (s, t) => s + toNum(t.currentBalanceAmount),
    0,
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
    (t) => t.accountStatusType?.toLowerCase() === "open",
  );
  const paidClosed = tradelines.filter((t) =>
    ["paid", "closed", "transferred"].includes(
      t.accountStatusType?.toLowerCase() || "",
    ),
  );
  const onTime = tradelines.filter(
    (t) =>
      toNum(t._30DayLates) + toNum(t._60DayLates) + toNum(t._90DayLates) === 0,
  );
  const mixHasInstallment = tradelines.some(
    (t) =>
      t.accountType?.toLowerCase() === "installment" ||
      t.accountType?.toLowerCase() === "mortgage",
  );
  const mixHasRevolving = tradelines.some(
    (t) =>
      t.accountType?.toLowerCase() === "revolving" ||
      t.accountType?.toLowerCase() === "chargeaccount",
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
      } reporting as agreed`,
    );
  if (paidClosed.length > 0)
    positives.push(
      `${paidClosed.length} account${
        paidClosed.length > 1 ? "s" : ""
      } paid/closed in good standing`,
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
        `Established credit history (~${years} years since oldest account)`,
      );
  }
  const sfTexts = (scores?.[0]?.scoreFactors || []).map((f) =>
    f.scoreFactorText.toLowerCase(),
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
  report: CreditReport,
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
    className={`rounded-xl shadow-card border border-gray-100 bg-white ${className}`}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{
  title: string;
  sub?: string;
  icon?: React.ReactNode;
}> = ({ title, sub, icon }) => (
  <div className="mb-3 sm:mb-4">
    <div className="flex items-center gap-2">
      <h2 className="text-base font-bold text-gray-900 sm:text-lg tracking-tight">
        {title}
      </h2>
      {icon}
    </div>
    {sub && <p className="text-xs sm:text-sm text-gray-500 mt-1">{sub}</p>}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 ${className}`}
  >
    {children}
  </span>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-gray-400 text-sm py-6 text-center">{children}</div>
);

// --- Bureau colors ---
const bureauColors: Record<
  "Experian" | "Equifax" | "TransUnion",
  { stroke: string; bg: string; text: string; chartColor: string }
> = {
  Experian: {
    stroke: "stroke-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    chartColor: "#3b82f6",
  },
  Equifax: {
    stroke: "stroke-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    chartColor: "#f43f5e",
  },
  TransUnion: {
    stroke: "stroke-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    chartColor: "#8b5cf6",
  },
};

const bureauIconPaths: Record<"Experian" | "Equifax" | "TransUnion", string> = {
  Experian: "/icons/Experian.png",
  Equifax: "/icons/Equifax.png",
  TransUnion: "/icons/Transunion.png",
};

import { BureauScoreCard } from "@/components/credit-repair/BureauScoreCard";

// --- Score History Bar Chart ---
const ScoreHistoryChart: React.FC<{
  timestamps: string[];
  reportsByTimestamp: Record<string, CreditReportWithId[]>;
}> = ({ timestamps, reportsByTimestamp }) => {
  if (timestamps.length < 2) return null;

  const orderedTs = [...timestamps].reverse();
  const labels = orderedTs.map((ts) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }),
  );

  const bureauList = ["Experian", "Equifax", "TransUnion"] as const;

  const datasets = bureauList.map((bureau) => ({
    label: bureau,
    data: orderedTs.map((ts) => {
      const docs = reportsByTimestamp[ts] ?? [];
      const bureauDoc = docs.find((d) => {
        const b = d?.report ? detectBureau(d.report) : null;
        return b === bureau;
      });
      const val = bureauDoc?.report?.scores?.[0]?.scoreValue;
      return val ? Number(val) : null;
    }),
    backgroundColor: bureauColors[bureau].chartColor + "cc",
    borderColor: bureauColors[bureau].chartColor,
    borderWidth: 1.5,
    borderRadius: 4,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 mb-6 animate-fade-in-up">
      <h3 className="text-sm font-bold text-gray-900 mb-4">
        Score History Over Time
      </h3>
      <Bar
        data={{ labels, datasets }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" as const, labels: { boxWidth: 12 } },
            tooltip: { mode: "index" as const, intersect: false },
          },
          scales: {
            y: {
              min: 300,
              max: 850,
              grid: { color: "rgba(0,0,0,0.04)" },
              ticks: { font: { size: 11 } },
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
          },
        }}
      />
    </div>
  );
};

// --- Utilization Doughnut ---
const UtilizationDoughnut: React.FC<{
  balance: number;
  limit: number;
  pct: number;
}> = ({ balance, limit, pct }) => {
  const utilized = Math.max(0, Math.min(balance, limit));
  const remaining = Math.max(0, limit - utilized);
  const primaryColor =
    pct <= 30 ? "#10b981" : pct <= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="w-20 h-20 flex-shrink-0">
      <Doughnut
        data={{
          datasets: [
            {
              data: limit > 0 ? [utilized, remaining] : [1, 0],
              backgroundColor: [primaryColor, "#f1f5f9"],
              borderWidth: 0,
              hoverOffset: 2,
            },
          ],
        }}
        options={{
          cutout: "70%",
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          animation: { duration: 1200 },
        }}
      />
    </div>
  );
};

// --- Collapsible bureau section for credit accounts ---
const BureauSection: React.FC<{
  bureau: "Experian" | "Equifax" | "TransUnion";
  tradelines: Tradeline[];
}> = ({ bureau, tradelines }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card animate-fade-in-up">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
            <Image
              src={bureauIconPaths[bureau]}
              alt={bureau}
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{bureau}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">
            {tradelines.length} account{tradelines.length !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <>
          {/* ── Mobile: card list (< md) ── */}
          <div className="md:hidden divide-y divide-gray-50">
            {tradelines.map((t, i) => {
              const isOpen = t.accountStatusType?.toLowerCase() === "open";
              const limit = t.creditLimitAmount
                ? `$${toNum(t.creditLimitAmount).toLocaleString()}`
                : t.highBalanceAmount
                  ? `$${toNum(t.highBalanceAmount).toLocaleString()}`
                  : "-";
              const balance = t.currentBalanceAmount
                ? `$${toNum(t.currentBalanceAmount).toLocaleString()}`
                : "-";
              const has30 = toNum(t._30DayLates) > 0;
              const has60 = toNum(t._60DayLates) > 0;
              const has90 = toNum(t._90DayLates) > 0;
              const hasLates = has30 || has60 || has90;
              return (
                <div
                  key={`${t.accountIdentifier}-${i}`}
                  className={cn(
                    "p-4 space-y-3 transition-colors cursor-pointer",
                    isOpen
                      ? "bg-blue-200 hover:bg-blue-400"
                      : "bg-white hover:bg-gray-50",
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {t.creditorName || "Unknown"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                        {t.accountIdentifier}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        isOpen
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {t.currentRatingType || "AS AGREED"}
                    </span>
                  </div>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Balance
                      </p>
                      <p className="font-semibold text-gray-900">{balance}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Limit / High Credit
                      </p>
                      <p className="font-semibold text-gray-900">{limit}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Opened
                      </p>
                      <p className="text-gray-700">
                        {t.accountOpenedDate
                          ? new Date(t.accountOpenedDate).toLocaleDateString(
                              "en-US",
                              { month: "2-digit", year: "numeric" },
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Last Activity
                      </p>
                      <p className="text-gray-700">
                        {t.lastActivityDate
                          ? new Date(t.lastActivityDate).toLocaleDateString(
                              "en-US",
                              { month: "2-digit", year: "numeric" },
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Acct Type
                      </p>
                      <p className="text-gray-700">{t.accountType || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Past Due
                      </p>
                      <p
                        className={cn(
                          "font-semibold",
                          t.pastDueAmount && toNum(t.pastDueAmount) > 0
                            ? "text-red-600"
                            : "text-gray-700",
                        )}
                      >
                        {t.pastDueAmount && toNum(t.pastDueAmount) > 0
                          ? `$${toNum(t.pastDueAmount).toLocaleString()}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Late payments row */}
                  {hasLates && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                        Late:
                      </span>
                      {has30 && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          30×{toNum(t._30DayLates)}
                        </span>
                      )}
                      {has60 && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          60×{toNum(t._60DayLates)}
                        </span>
                      )}
                      {has90 && (
                        <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          90+×{toNum(t._90DayLates)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Original creditor / comments */}
                  {(t.originalCreditorName ||
                    (t.comments && t.comments.length > 0)) && (
                    <div className="pt-1 border-t border-gray-100 space-y-0.5">
                      {t.originalCreditorName && (
                        <p className="text-[10px] text-blue-700 font-medium uppercase">
                          Original creditor: {t.originalCreditorName}
                        </p>
                      )}
                      {t.comments?.map((c, ci) => (
                        <p key={ci} className="text-[10px] text-gray-500">
                          {c.commentText}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop: scrollable table (≥ md) ── */}
          <div className="hidden md:block">
            <ScrollArea
              type="always"
              className="h-[calc(100vh-380px)] min-h-[400px] w-full min-w-0 rounded-b-xl"
            >
              <Table className="min-w-[1100px] text-[10px] sm:text-xs">
                <TableHeader className="bg-gray-50/70 border-b border-gray-100">
                  <TableRow>
                    <TableHead className="text-left px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>E</div>
                      <div>C</div>
                      <div>O</div>
                      <div>A</div>
                    </TableHead>
                    <TableHead className="text-left px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide min-w-[120px]">
                      Creditor
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>Date</div>
                      <div>Reported</div>
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>Date</div>
                      <div>Opened</div>
                      <div className="font-normal text-gray-400">DLA</div>
                    </TableHead>
                    <TableHead className="text-right px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>High Credit</div>
                      <div>or Limit</div>
                      <div className="font-normal text-gray-400">Acct Type</div>
                    </TableHead>
                    <TableHead className="text-right px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>Balance</div>
                      <div className="font-normal text-gray-400">Terms</div>
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>Past</div>
                      <div>Due</div>
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      <div>Mo</div>
                      <div>Rev</div>
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      30
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      60
                    </TableHead>
                    <TableHead className="text-center px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide">
                      90+
                    </TableHead>
                    <TableHead className="text-left px-2 py-2.5 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wide min-w-[100px]">
                      <div>Status</div>
                      <div className="font-normal text-gray-400">Source</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradelines.map((t, i) => {
                    const acctOwnershipCode =
                      t.accountOwnershipType?.charAt(0).toUpperCase() || "-";
                    const isOpen =
                      t.accountStatusType?.toLowerCase() === "open";
                    return (
                      <React.Fragment key={`${t.accountIdentifier}-${i}`}>
                        <TableRow
                          className={cn(
                            "border-b hover:bg-blue-50/30 transition-colors",
                            isOpen ? "bg-blue-200 hover:bg-blue-400" : "",
                          )}
                        >
                          <TableCell className="px-2 py-2.5 text-center align-top font-medium">
                            {acctOwnershipCode}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 align-top">
                            <div className="font-semibold text-gray-900">
                              {t.creditorName || "Unknown"}
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">
                              {t.accountIdentifier}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            {t.accountReportedDate
                              ? new Date(
                                  t.accountReportedDate,
                                ).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  year: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            <div>
                              {t.accountOpenedDate
                                ? new Date(
                                    t.accountOpenedDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    year: "2-digit",
                                  })
                                : "-"}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1">
                              {t.lastActivityDate
                                ? new Date(
                                    t.lastActivityDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    year: "2-digit",
                                  })
                                : "--/--"}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right align-top">
                            <div className="font-semibold">
                              {t.creditLimitAmount
                                ? `$${toNum(t.creditLimitAmount).toLocaleString()}`
                                : t.highBalanceAmount
                                  ? `$${toNum(t.highBalanceAmount).toLocaleString()}`
                                  : "-"}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1">
                              {t.accountType || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right align-top">
                            <div className="font-semibold">
                              {t.currentBalanceAmount
                                ? `$${toNum(t.currentBalanceAmount).toLocaleString()}`
                                : "-"}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1">
                              {t.monthlyPaymentAmount
                                ? `$${toNum(t.monthlyPaymentAmount).toLocaleString()}`
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            {t.pastDueAmount && toNum(t.pastDueAmount) > 0
                              ? `$${toNum(t.pastDueAmount).toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            {t.monthsReviewedCount || "-"}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            <span
                              className={
                                toNum(t._30DayLates) > 0
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {toNum(t._30DayLates)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            <span
                              className={
                                toNum(t._60DayLates) > 0
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {toNum(t._60DayLates)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center align-top">
                            <span
                              className={
                                toNum(t._90DayLates) > 0
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {toNum(t._90DayLates)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 align-top">
                            <div className="font-medium text-gray-800">
                              {t.currentRatingType || "AS AGREED"}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {bureauLabel(t.sourceType)
                                ?.toUpperCase()
                                .slice(0, 3)}
                            </div>
                          </TableCell>
                        </TableRow>
                        {(t.originalCreditorName ||
                          (t.comments && t.comments.length > 0)) && (
                          <TableRow
                            className={cn(
                              "border-b hover:bg-blue-50/30 transition-colors",
                              isOpen ? "bg-blue-200 hover:bg-blue-400" : "",
                            )}
                          >
                            <TableCell />
                            <TableCell
                              colSpan={11}
                              className="px-2 py-2 text-[9px] sm:text-[10px]"
                            >
                              {t.originalCreditorName && (
                                <div className="text-blue-700 font-medium uppercase">
                                  ORIGINAL CREDITOR: {t.originalCreditorName}
                                </div>
                              )}
                              {t.comments && t.comments.length > 0 && (
                                <div className="text-gray-600 mt-1">
                                  {t.comments.map((comment, idx) => (
                                    <div key={idx}>{comment.commentText}</div>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" className="w-full" />
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};

type Props = {
  userId: string;
  userData?: UserWithId;
};

// --- Main Page ---
const ClientCreditReport = ({ userId, userData }: Props) => {
  // const router = useRouter();
  const queryClient = useQueryClient();
  const { userData: queryUserData } = useUserQuery(userId);
  const activeUserData = queryUserData || userData;

  // Load user's latest funding application
  const { appliedFunding } = useGetClientApplyFunding(userId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutMetadata, setCheckoutMetadata] = useState<any>(null);
  const { crsReport, isLoading } = useClientCRSReportQuery({ userId });
  const { data: feeSettings } = useFeeSettings();
  const { data: membership } = useMembership(userId);
  const reportFee = feeSettings?.creditReportFee || 49;

  const { data: walletData } = useWalletQuery(userId);
  const currentBalance = walletData?.balance || 0;
  const hasSufficientBalance = currentBalance >= reportFee;
  const spendFunds = useSpendFundsMutation();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  const isEligibleForFreePull = useMemo(() => {
    return checkFreePullEligibility(membership, activeUserData?.lastFreePullAt);
  }, [membership, activeUserData?.lastFreePullAt]);

  const membershipTierLabel = useMemo(() => {
    if (membership?.tier === "tier_starter") return "Starter";
    if (membership?.tier === "tier_pro") return "Pro";
    if (membership?.tier === "tier_executive") return "Executive";
    return "Premium";
  }, [membership?.tier]);

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
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      ),
    [reportsByTimestamp],
  );

  // State for selected timestamp (default to most recent)
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>("");

  // State for inquiries section collapsed/expanded per bureau
  const [expandedInquiries, setExpandedInquiries] = useState<
    Record<string, boolean>
  >({
    Experian: true,
    Equifax: true,
    TransUnion: true,
  });

  // Set initial timestamp when data loads
  React.useEffect(() => {
    if (timestamps.length > 0 && !selectedTimestamp) {
      setSelectedTimestamp(timestamps[0]);
    }
  }, [timestamps, selectedTimestamp]);

  const handleGenerateReport = async () => {
    const latestApp = appliedFunding?.[0];
    const generatedRef = latestApp?.referenceNumber;

    if (!isEligibleForFreePull && !hasSufficientBalance) {
      setIsConfirmOpen(false);
      setTopUpModalOpen(true);
      return;
    }

    if (!isEligibleForFreePull && hasSufficientBalance) {
      try {
        setIsGenerating(true);
        // Trigger the fund deduction
        await spendFunds.mutateAsync({
          amount: reportFee,
          description: "Credit Report Pull Fee",
          metadata: { reportType: "personal" },
        });

        // Upon success, trigger the report generation directly
        await generateCRSReport({
          userId,
          bureaus: { equifax: true, experian: true, transunion: true },
          bypassPremiumCheck: true,
        });

        toast.success(
          "Payment processed and credit report generation started. Please wait a few moments for the data to appear.",
        );

        // Invalidate the React Query cache
        queryClient.invalidateQueries({ queryKey: [GET_USER, userId] });
        queryClient.invalidateQueries({
          queryKey: [GET_USER_CRS_REPORT, userId],
        });
        queryClient.invalidateQueries({ queryKey: [GET_WALLET, userId] });

        setIsConfirmOpen(false);
      } catch (error: any) {
        console.error(
          "Failed to process wallet payment and generate report:",
          error,
        );
        toast.error(
          error.message ||
            "Failed to process wallet payment and generate report. Please contact support.",
        );
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      setIsGenerating(true);
      const res = await initiateCRSReportCheckout({
        userId,
        reportType: "personal",
        referenceNumber: latestApp?.referenceNumber,
      });

      if (res.checkoutId && res.url) {
        setCheckoutMetadata({
          reportType: "personal",
          referenceNumber:
            "metadata" in res
              ? (res as any).metadata?.referenceNumber
              : undefined,
        });
        setCheckoutId(res.checkoutId);
        setIsConfirmOpen(false);
      } else if ("success" in res && res.success) {
        toast.success(
          "Credit report generation has started. Please wait a few moments for the new data to appear.",
        );
        setIsConfirmOpen(false);
        queryClient.invalidateQueries({ queryKey: [GET_USER, userId] });
        queryClient.invalidateQueries({
          queryKey: [GET_USER_CRS_REPORT, userId],
        });
      }
    } catch (error: any) {
      console.error("Failed to initiate CRS report checkout:", error);
      toast.error(
        error.message ||
          "Failed to generate credit report. Please contact support.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Get reports for selected timestamp
  const selectedReports = useMemo(
    () =>
      selectedTimestamp ? reportsByTimestamp[selectedTimestamp] || [] : [],
    [selectedTimestamp, reportsByTimestamp],
  );

  const bureauMap = useMemo(
    () => groupByBureau(selectedReports),
    [selectedReports],
  );

  const prevReports = useMemo(() => {
    const currentIndex = timestamps.indexOf(selectedTimestamp);
    const prevTimestamp =
      currentIndex >= 0 && currentIndex + 1 < timestamps.length
        ? timestamps[currentIndex + 1]
        : null;
    return prevTimestamp ? reportsByTimestamp[prevTimestamp] || [] : [];
  }, [timestamps, selectedTimestamp, reportsByTimestamp]);

  const prevBureauMap = useMemo(
    () => groupByBureau(prevReports),
    [prevReports],
  );

  const parsedScores = useMemo(() => {
    const expScore =
      toNum(bureauMap.Experian?.report?.scores?.[0]?.scoreValue) || 0;
    const prevExpScore =
      toNum(prevBureauMap.Experian?.report?.scores?.[0]?.scoreValue) || 0;

    const eqScore =
      toNum(bureauMap.Equifax?.report?.scores?.[0]?.scoreValue) || 0;
    const prevEqScore =
      toNum(prevBureauMap.Equifax?.report?.scores?.[0]?.scoreValue) || 0;

    const tuScore =
      toNum(bureauMap.TransUnion?.report?.scores?.[0]?.scoreValue) || 0;
    const prevTuScore =
      toNum(prevBureauMap.TransUnion?.report?.scores?.[0]?.scoreValue) || 0;

    return {
      experian: {
        bureau: "experian" as const,
        score: expScore,
        delta: prevExpScore ? expScore - prevExpScore : 0,
        pulledAt: bureauMap.Experian?.createdAt || "",
        prevScore: prevExpScore,
      },
      equifax: {
        bureau: "equifax" as const,
        score: eqScore,
        delta: prevEqScore ? eqScore - prevEqScore : 0,
        pulledAt: bureauMap.Equifax?.createdAt || "",
        prevScore: prevEqScore,
      },
      transunion: {
        bureau: "transunion" as const,
        score: tuScore,
        delta: prevTuScore ? tuScore - prevTuScore : 0,
        pulledAt: bureauMap.TransUnion?.createdAt || "",
        prevScore: prevTuScore,
      },
    };
  }, [bureauMap, prevBureauMap]);

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
    [bureauMap],
  );

  // Aggregate tradelines across all bureaus
  const allTradelines: Tradeline[] = useMemo(
    () => [
      ...(bureauMap.Experian?.report.tradelines ?? []),
      ...(bureauMap.TransUnion?.report.tradelines ?? []),
      ...(bureauMap.Equifax?.report.tradelines ?? []),
    ],
    [bureauMap],
  );

  const negItems = useMemo(
    () => getNegativeItems(allTradelines),
    [allTradelines],
  );
  const positives = useMemo(
    () =>
      getPositiveFactors(allTradelines, [
        ...(bureauMap.Experian?.report.scores ?? []),
        ...(bureauMap.TransUnion?.report.scores ?? []),
        ...(bureauMap.Equifax?.report.scores ?? []),
      ]),
    [allTradelines, bureauMap],
  );
  const util = useMemo(
    () => computeUtilization(allTradelines),
    [allTradelines],
  );

  // Pull a friendly timestamp: max of responseDetail.dateRequested across bureaus, else latest createdAt.
  const pulledAt = useMemo(() => {
    const dates: number[] = [];
    [bureauMap.Experian, bureauMap.TransUnion, bureauMap.Equifax].forEach(
      (doc) => {
        const dr = doc?.report.responseDetail?.dateRequested;
        if (dr) dates.push(new Date(dr).getTime());
        if (doc?.createdAt) dates.push(new Date(doc.createdAt).getTime());
      },
    );
    if (dates.length === 0) return undefined;
    return new Date(Math.max(...dates)).toLocaleString();
  }, [bureauMap]);

  // Animated summary stats
  const openAccounts = allTradelines.filter(
    (t) => t.accountStatusType?.toLowerCase() === "open",
  ).length;
  const animatedPct = useCountUp(Math.round(util.pct), 1200);
  const animatedOpen = useCountUp(openAccounts, 1000);
  const animatedNeg = useCountUp(negItems.length, 900);

  if (isLoading) {
    return (
      <div className="w-full mx-auto max-w-6xl p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="skeleton h-7 w-48 rounded-lg mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        {/* Score cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border border-gray-100 p-5 stagger-${i + 1}`}
            >
              <div className="skeleton h-4 w-24 rounded mb-4" />
              <div className="skeleton h-24 w-full rounded-lg mb-3" />
              <div className="skeleton h-6 w-16 rounded mx-auto" />
            </div>
          ))}
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="skeleton h-4 w-20 rounded mb-3" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasAnyReport = Boolean(
    bureauMap.Experian || bureauMap.TransUnion || bureauMap.Equifax,
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
    <div className="w-full mx-auto max-w-6xl p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-5 sm:mb-7 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                My Credit Report
              </h1>
            </div>
            {pulledAt && (
              <p className="text-gray-500 text-sm flex items-center gap-1.5 ml-10">
                <Clock className="w-3.5 h-3.5" />
                Pulled {pulledAt}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <ConfirmButton
              open={isConfirmOpen}
              onOpenChange={setIsConfirmOpen}
              onConfirm={handleGenerateReport}
              isLoading={isGenerating}
              disabled={isGenerating}
              description={
                isEligibleForFreePull ? (
                  <div className="space-y-3 mt-2 text-sm text-blue-800 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Free Monthly Pull Available!
                    </p>
                    <p>
                      As an active {membershipTierLabel} member, you are
                      eligible for 1 free credit report pull every calendar
                      month.
                    </p>
                    <p>
                      You have not used your free pull for this month yet.
                      Pulling a new credit report now will use this monthly
                      benefit and will be completely free of charge.
                    </p>
                  </div>
                ) : hasSufficientBalance ? (
                  <div className="space-y-3 mt-2 text-sm text-gray-600">
                    <p>
                      Pulling a new credit report will deduct from your wallet
                      balance.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5 font-medium text-blue-900 text-left">
                      <div className="flex justify-between">
                        <span>Report Fee:</span>
                        <span className="font-mono">
                          ${reportFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Balance:</span>
                        <span className="font-mono">
                          ${currentBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-blue-200">
                        <span>Remaining Balance:</span>
                        <span className="font-mono">
                          ${(currentBalance - reportFee).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p>This report will be generated instantly.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-2 text-sm text-gray-600">
                    <p>
                      Pulling a new credit report requires a fee of{" "}
                      <strong>${reportFee.toFixed(2)}</strong>.
                    </p>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5 font-medium text-red-900 text-left">
                      <div className="flex justify-between">
                        <span>Report Fee:</span>
                        <span className="font-mono">
                          ${reportFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Balance:</span>
                        <span className="font-mono">
                          ${currentBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-red-200 font-bold">
                        <span>Amount Needed:</span>
                        <span className="font-mono">
                          ${(reportFee - currentBalance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p>Please top up your wallet balance to proceed.</p>
                  </div>
                )
              }
              confirmLabel={
                isEligibleForFreePull
                  ? "Pull Credit Report for Free"
                  : hasSufficientBalance
                    ? `Pay $${reportFee.toFixed(2)} & Pull Report`
                    : "Top Up Wallet"
              }
              classNameAction="bg-blue-600 hover:bg-blue-700 text-white"
              title={
                isEligibleForFreePull
                  ? "Free Credit Report Pull"
                  : hasSufficientBalance
                    ? "Pay with Wallet"
                    : "Insufficient Wallet Balance"
              }
              trigger={
                <button
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isGenerating}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors w-full sm:w-auto justify-center"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pulling Credit Report...
                    </>
                  ) : (
                    <>
                      {isEligibleForFreePull ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Pull Credit Report (Free)
                        </>
                      ) : (
                        <>
                          <ReceiptIcon className="w-4 h-4" />
                          Pull Credit Report
                        </>
                      )}
                    </>
                  )}
                </button>
              }
            />

            {timestamps.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap font-medium">
                  Report Date:
                </label>
                <Select
                  value={selectedTimestamp}
                  onValueChange={setSelectedTimestamp}
                >
                  <SelectTrigger className="w-full sm:w-[240px] border-gray-200">
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
        </div>
      </header>

      {/* Credit Scores */}
      <SectionTitle
        title="Credit Scores"
        sub="Across all three bureaus — Experian, Equifax, and TransUnion"
        icon={<ShieldCheck className="w-4 h-4 text-blue-600" />}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <BureauScoreCard score={parsedScores.experian} />
        <BureauScoreCard score={parsedScores.equifax} />
        <BureauScoreCard score={parsedScores.transunion} />
      </div>

      {/* Score History Chart */}
      <ScoreHistoryChart
        timestamps={timestamps}
        reportsByTimestamp={reportsByTimestamp}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
        {/* Utilization card with doughnut */}
        <Card className="p-4 sm:p-5 flex items-center gap-4 card-hover animate-fade-in-up stagger-1">
          <UtilizationDoughnut
            balance={util.totalBal}
            limit={util.totalLimit}
            pct={Math.round(util.pct)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-1">
              Revolving Utilization
            </p>
            <p
              className={cn(
                "text-3xl font-bold font-mono",
                util.pct <= 30
                  ? "text-emerald-600"
                  : util.pct <= 60
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {animatedPct}%
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {fmtCurrency(util.totalBal)} / {fmtCurrency(util.totalLimit)}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-4 card-hover animate-fade-in-up stagger-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">
              Open Accounts
            </p>
            <p className="text-3xl font-bold font-mono text-gray-900">
              {animatedOpen}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Reporting with status &quot;Open&quot;
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-4 card-hover animate-fade-in-up stagger-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              negItems.length > 0 ? "bg-red-50" : "bg-emerald-50",
            )}
          >
            <ShieldAlert
              className={cn(
                "w-6 h-6",
                negItems.length > 0 ? "text-red-500" : "text-emerald-500",
              )}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">
              Negative Items
            </p>
            <p
              className={cn(
                "text-3xl font-bold font-mono",
                negItems.length > 0 ? "text-red-600" : "text-emerald-600",
              )}
            >
              {animatedNeg}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Derogatory flags or late payments
            </p>
          </div>
        </Card>
      </div>

      {/* Alert Messages */}
      {allAlertMessages.length > 0 && (
        <>
          <SectionTitle
            title="Alert Messages"
            sub="Important notifications from credit bureaus"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <div className="space-y-3 mb-6 sm:mb-10">
            {allAlertMessages.map((alert, i) => {
              const cat =
                alert.responseAlertMessageCategoryType?.toLowerCase() ?? "";
              const isError = cat.includes("fraud") || cat.includes("block");
              const isInfo = cat.includes("info") || cat.includes("notice");
              return (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3 animate-fade-in-up card-hover",
                    isError
                      ? "bg-red-50 border-red-200"
                      : isInfo
                        ? "bg-blue-50 border-blue-200"
                        : "bg-amber-50 border-amber-200",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "w-5 h-5 flex-shrink-0 mt-0.5",
                      isError
                        ? "text-red-500"
                        : isInfo
                          ? "text-blue-500"
                          : "text-amber-500",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isError
                            ? "text-red-800"
                            : isInfo
                              ? "text-blue-800"
                              : "text-amber-800",
                        )}
                      >
                        {bureauLabel(alert.sourceType)}
                      </span>
                      {alert.responseAlertMessageCategoryType && (
                        <Badge
                          className={cn(
                            isError
                              ? "bg-red-100 text-red-700"
                              : isInfo
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {alert.responseAlertMessageCategoryType}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        isError
                          ? "text-red-700"
                          : isInfo
                            ? "text-blue-700"
                            : "text-amber-700",
                      )}
                    >
                      {alert.responseAlertMessageText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Inquiries per bureau */}
      <SectionTitle
        title="Inquiries by Bureau"
        sub="Hard inquiries reported per bureau"
        icon={<Search className="w-4 h-4 text-gray-500" />}
      />
      <div className="space-y-3 mb-6 sm:mb-10">
        {(["Experian", "Equifax", "TransUnion"] as const).map((b, idx) => {
          const colors = bureauColors[b];
          const expanded = expandedInquiries[b];

          return (
            <div
              key={b}
              className={`bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden animate-fade-in-up stagger-${idx + 1}`}
            >
              <button
                onClick={() =>
                  setExpandedInquiries((prev) => ({ ...prev, [b]: !prev[b] }))
                }
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-white border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src={bureauIconPaths[b]}
                      alt={b}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{b}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${colors.bg} ${colors.text}`}>
                    {inquiriesByBureau[b].length}
                  </Badge>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              {expanded && (
                <div className="p-4">
                  {inquiriesByBureau[b].length === 0 ? (
                    <Empty>No inquiries for {b}.</Empty>
                  ) : (
                    <ul className="space-y-2.5 max-h-48 sm:max-h-60 overflow-auto pr-1">
                      {inquiriesByBureau[b].map((q, i) => (
                        <li
                          key={`${q.creditorName}-${q.inquiryDate}-${i}`}
                          className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {q.creditorName || "Unknown"}
                            </p>
                            {q.businessType && (
                              <p className="text-[10px] text-gray-400">
                                {q.businessType}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {q.inquiryDate
                              ? new Date(q.inquiryDate).toLocaleDateString()
                              : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tradelines by Bureau — collapsible sections */}
      <SectionTitle
        title="Credit Accounts"
        sub="All accounts reported per bureau"
        icon={<Info className="w-4 h-4 text-gray-500" />}
      />
      <div className="space-y-4 mb-6 sm:mb-10">
        {(["Experian", "Equifax", "TransUnion"] as const).map((bureau) =>
          tradelinesByBureau[bureau].length === 0 ? (
            <div
              key={bureau}
              className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center"
            >
              <Empty>No accounts for {bureau}.</Empty>
            </div>
          ) : (
            <BureauSection
              key={bureau}
              bureau={bureau}
              tradelines={tradelinesByBureau[bureau]}
            />
          ),
        )}
      </div>

      {/* Negative items */}
      <SectionTitle
        title="Negative Items"
        sub="Accounts with derogatory marks or late payments across all bureaus"
        icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
      />
      <Card className="overflow-hidden mb-6 sm:mb-10 animate-fade-in-up">
        {negItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              No Negative Items
            </p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              No derogatory marks or late payments detected across all bureaus.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Card Layout */}
            <div className="md:hidden divide-y divide-gray-50">
              {negItems.map((t, i) => (
                <div
                  key={`${t.sourceType}-${t.accountIdentifier}-${i}`}
                  className="p-4 space-y-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {t.creditorName || "—"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                        {maskId(t.accountIdentifier)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        bureauColors[
                          bureauLabel(t.sourceType) as
                            | "Experian"
                            | "Equifax"
                            | "TransUnion"
                        ]?.bg ?? "bg-gray-100",
                        bureauColors[
                          bureauLabel(t.sourceType) as
                            | "Experian"
                            | "Equifax"
                            | "TransUnion"
                        ]?.text ?? "text-gray-600",
                      )}
                    >
                      {bureauLabel(t.sourceType)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Status
                      </p>
                      <p className="text-red-600 font-semibold">
                        {t.accountStatusType || "—"}
                        {t.derogatoryDataIndicator ? " · Derog." : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Late 30/60/90
                      </p>
                      <p className="font-mono text-red-600 font-semibold">
                        {toNum(t._30DayLates)}/{toNum(t._60DayLates)}/
                        {toNum(t._90DayLates)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Balance
                      </p>
                      <p className="font-medium text-gray-900">
                        {fmtCurrency(toNum(t.currentBalanceAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                        Last Activity
                      </p>
                      <p className="text-gray-700">
                        {t.lastActivityDate
                          ? new Date(t.lastActivityDate).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Layout */}
            <div className="hidden md:block">
              <ScrollArea type="always" className="w-full min-w-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {[
                          "Bureau",
                          "Creditor",
                          "Acct #",
                          "Status",
                          "Late 30/60/90",
                          "Balance",
                          "Last Activity",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {negItems.map((t, i) => (
                        <tr
                          key={`${t.sourceType}-${t.accountIdentifier}-${i}`}
                          className="border-t border-gray-50 hover:bg-red-50/30 transition-colors"
                        >
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                bureauColors[
                                  bureauLabel(t.sourceType) as
                                    | "Experian"
                                    | "Equifax"
                                    | "TransUnion"
                                ]?.bg ?? "bg-gray-100",
                                bureauColors[
                                  bureauLabel(t.sourceType) as
                                    | "Experian"
                                    | "Equifax"
                                    | "TransUnion"
                                ]?.text ?? "text-gray-600",
                              )}
                            >
                              {bureauLabel(t.sourceType)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium text-gray-900">
                            {t.creditorName || "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-gray-500">
                            {maskId(t.accountIdentifier)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-red-600 font-semibold">
                              {t.accountStatusType || "—"}
                              {t.derogatoryDataIndicator ? " · Derog." : ""}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-red-600 font-semibold">
                            {toNum(t._30DayLates)}/{toNum(t._60DayLates)}/
                            {toNum(t._90DayLates)}
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            {fmtCurrency(toNum(t.currentBalanceAmount))}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500">
                            {t.lastActivityDate
                              ? new Date(
                                  t.lastActivityDate,
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" className="w-full" />
              </ScrollArea>
            </div>
          </>
        )}
      </Card>

      {/* Positive factors */}
      <SectionTitle
        title="Positive Factors"
        sub="Strengths identified from your combined credit profile"
        icon={<Sparkles className="w-4 h-4 text-blue-500" />}
      />
      <Card className="p-4 sm:p-5 mb-6 sm:mb-10 animate-fade-in-up">
        {positives.length === 0 ? (
          <Empty>
            No positive factors detected yet. Provide more bureau data for a
            fuller picture.
          </Empty>
        ) : (
          <ul className="space-y-2.5">
            {positives.map((p, i) => (
              <li
                key={i}
                className={`flex items-start gap-2.5 stagger-${Math.min(i + 1, 8)}`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{p}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4">
        Note: When multiple docs per bureau exist for the same date, the newest
        is used.
      </p>

      {/* Checkout Modal */}
      <Dialog
        open={!!checkoutId}
        onOpenChange={(open) => !open && setCheckoutId(null)}
      >
        <DialogContent
          className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] p-0 overflow-hidden bg-transparent border-none shadow-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Complete Your Purchase</DialogTitle>
          {checkoutId && (
            <div className="bg-white rounded-xl shadow-2xl overflow-y-auto w-full max-h-[90vh] md:max-h-[85vh] relative">
              <button
                onClick={() => setCheckoutId(null)}
                className="cursor-pointer absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <WhopCheckoutEmbed
                sessionId={checkoutId}
                prefill={{
                  email: activeUserData?.email,
                  address: {
                    country: "US",
                  },
                }}
                onComplete={async (planId, receiptId) => {
                  try {
                    const response = await fetch(
                      `/api/user/${userId}/crs/purchase`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          planId,
                          receiptId,
                          checkoutId,
                          metadata: checkoutMetadata,
                        }),
                      },
                    );

                    if (!response.ok) {
                      throw new Error("Failed to trigger report generation");
                    }

                    toast.success(
                      "Payment successful! Generating your credit report...",
                    );
                    setCheckoutId(null);
                    setCheckoutMetadata(null);
                  } catch (error) {
                    console.error(error);
                    toast.error(
                      "Payment succeeded but report generation failed. Please contact support.",
                    );
                    setCheckoutId(null);
                  }
                }}
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Spinner displayText="Loading secure checkout..." />
                  </div>
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {userId && (
        <TopUpModal
          isOpen={topUpModalOpen}
          onClose={() => setTopUpModalOpen(false)}
          userId={userId}
          userEmail={activeUserData?.email || ""}
        />
      )}
    </div>
  );
};

export default ClientCreditReport;

"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  TrendingUp,
  ShieldCheck,
  Clock,
  Upload,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  Settings,
  X,
  Plus,
  Minus,
  Check,
  CreditCard,
  Building,
  Home,
  Receipt,
  Award,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRefreshCRSData } from "@/hooks/crs";
import {
  bureaus,
  categories,
  stages,
  labels,
  sources,
  buildPlan,
  auImpact,
  totals,
  utilization,
  isCurrentProvider,
  refreshEligibility,
  type Snapshot,
  type Provider,
  type Bureau,
  type Category,
  type Enrollment,
  type Rule,
  type Stage,
  type CreditReport,
} from "@/lib/positive/core";

const bureauLogos: Record<Bureau, string> = {
  experian: "/icons/Experian.png",
  equifax: "/icons/Equifax.png",
  transunion: "/icons/Transunion.png",
};

const bureauLabels: Record<Bureau, string> = {
  experian: "Experian",
  equifax: "Equifax",
  transunion: "TransUnion",
};

function fmtPulled(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const nth = (dayNum: number) => {
      if (dayNum > 3 && dayNum < 21) return "th";
      switch (dayNum % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}${nth(day)}, ${year}`;
  } catch {
    return iso || "";
  }
}

const displayBureaus: Bureau[] = ["equifax", "transunion", "experian"];

const currency = (n: number | null) =>
  n === null
    ? "Not confirmed"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

const percent = (n: number | null) =>
  n === null ? "Not available" : `${n.toFixed(1)}%`;

const shortDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const displayStage: Record<Stage, string> = {
  selected: "Selected",
  registered: "Registered",
  documents: "Documents uploaded",
  paid: "Paid / ready",
  waiting: "Waiting to post",
  posted: "Verified posted",
};

const stageMeta: Record<
  Stage,
  {
    title: string;
    shortLabel: string;
    stepNum: number;
    description: string;
    badgeText: string;
  }
> = {
  selected: {
    title: "Account Selected for Enrollment",
    shortLabel: "Selected",
    stepNum: 1,
    description:
      "Enrollment candidate initialized. Complete registration directly with the provider.",
    badgeText: "Step 1 of 6",
  },
  registered: {
    title: "Provider Registration Complete",
    shortLabel: "Registered",
    stepNum: 2,
    description:
      "Account registered with provider. Upload your registration confirmation document to verify.",
    badgeText: "Step 2 of 6",
  },
  documents: {
    title: "Documents Received & Verified",
    shortLabel: "Documents",
    stepNum: 3,
    description:
      "Documentation on file. Complete any required deposit, fee, or setup payment directly with provider.",
    badgeText: "Step 3 of 6",
  },
  paid: {
    title: "Payment Complete & Ready",
    shortLabel: "Paid / Ready",
    stepNum: 4,
    description:
      "Setup confirmed. Waiting for the upcoming statement cycle close to initiate bureau reporting.",
    badgeText: "Step 4 of 6",
  },
  waiting: {
    title: "Waiting to Post to Credit Report",
    shortLabel: "Waiting to Post",
    stepNum: 5,
    description:
      "Monitoring statement close date and your next monthly credit report pull. Bureau matching occurs automatically.",
    badgeText: "Step 5 of 6",
  },
  posted: {
    title: "Verified Posted to Credit Profile",
    shortLabel: "Verified Posted",
    stepNum: 6,
    description:
      "This tradeline is confirmed active and reporting positive payment history across connected bureaus.",
    badgeText: "Step 6 of 6",
  },
};

const categoryIcons: Record<Category, typeof TrendingUp> = {
  au: Award,
  rent: Home,
  installment: DollarSign,
  revolving: CreditCard,
  bills: Receipt,
  cards: Layers,
};

function Modal({
  title,
  subtitle,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95`}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {subtitle && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function PositiveCoachView({
  userId,
  disputeUrl = "/credit-repair",
}: {
  userId: string;
  disputeUrl?: string;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [bureau, setBureau] = useState<Bureau>("experian");
  const [openCategory, setOpenCategory] = useState<Category | null>("au");
  const [pickerCategory, setPickerCategory] = useState<Category | null>(null);
  const [pickerChoices, setPickerChoices] = useState<string[]>([]);
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(
    null,
  );
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [helpMessage, setHelpMessage] = useState("");
  const [estimate, setEstimate] = useState<{
    available: boolean;
    low?: number;
    high?: number;
    provider?: string;
  } | null>(null);
  const [now, setNow] = useState(new Date().toISOString());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [addingAU, setAddingAU] = useState(false);

  // Load snapshot from API
  const loadSnapshot = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/user/${userId}/positive`);
      if (!res.ok) {
        throw new Error(
          `Failed to load positive snapshot (Status ${res.status})`,
        );
      }
      const data = await res.json();
      setSnapshot(data);
      setError(null);
    } catch (err: any) {
      console.error("Positive coach load error:", err);
      setError(err.message || "Unable to load positive credit plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
    const interval = setInterval(() => {
      setNow(new Date().toISOString());
      loadSnapshot();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Execute API action with busy/error/notice state management
  const runAction = async (fn: () => Promise<unknown>, successMsg?: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await loadSnapshot();
      if (successMsg) {
        setNotice(successMsg);
        toast.success(successMsg);
      }
    } catch (err: any) {
      const msg = err.message || "Unable to complete action.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Build recommendation plan
  const plan = useMemo(() => {
    return snapshot ? buildPlan(snapshot, bureau, now) : null;
  }, [snapshot, bureau, now]);

  // Determine currently chosen / proposed providers
  const chosenProviders = useMemo(() => {
    if (!snapshot || !plan) return [];
    const picks: Provider[] = [];
    for (const step of plan.steps) {
      const selected = snapshot.enrollments
        .filter((e) => e.category === step.category && e.stage !== "posted")
        .map((e) => snapshot.providers.find((p) => p.id === e.providerId))
        .filter((p): p is Provider => !!p);

      const opts =
        step.category === "au"
          ? plan.au.map((x) => x.provider)
          : snapshot.providers.filter(
              (p) =>
                p.category === step.category &&
                isCurrentProvider(p, now, snapshot.demo) &&
                p.bureaus.includes(bureau),
            );

      const remaining = opts.filter(
        (p) =>
          !selected.some((x) => x.id === p.id) &&
          !snapshot.report?.accounts.some((a) => a.providerId === p.id),
      );

      picks.push(
        ...selected,
        ...remaining.slice(0, Math.max(0, step.quantity - selected.length)),
      );
    }
    return picks;
  }, [snapshot, plan, now, bureau]);

  const report = snapshot?.report;
  const score = report?.scores.find((x) => x.bureau === bureau);

  // Fetch score estimation simulation
  useEffect(() => {
    if (!report || !score || !userId) return;
    let live = true;
    fetch(`/api/user/${userId}/positive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "estimate",
        bureau,
        model: score.model,
        providerIds: chosenProviders.map((p) => p.id),
      }),
    })
      .then((res) => (res.ok ? res.json() : { available: false }))
      .then((data) => {
        if (live) setEstimate(data);
      })
      .catch(() => {
        if (live) setEstimate({ available: false });
      });

    return () => {
      live = false;
    };
  }, [
    userId,
    report?.id,
    bureau,
    score?.model,
    chosenProviders.map((p) => p.id).join(","),
  ]);

  // Active enrollment modal target
  const activeEnrollment = snapshot?.enrollments.find(
    (e) => e.id === activeEnrollmentId,
  );
  const activeProvider = snapshot?.providers.find(
    (p) => p.id === activeEnrollment?.providerId,
  );
  const activeRule = snapshot?.rules
    .filter(
      (r) =>
        r.category === activeEnrollment?.category && r.status === "published",
    )
    .sort((a, b) => b.version - a.version)[0];
  const activeGuidance = activeRule?.instructions?.length
    ? activeRule.instructions
    : (activeProvider?.instructions ?? []);

  const handleFileUpload = async (f: File) => {
    if (!f || !activeEnrollment || uploadingDoc) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }
    setUploadingDoc(true);
    setError(null);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("enrollmentId", activeEnrollment.id);

      const res = await fetch(`/api/user/${userId}/positive/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || data.errors || `Upload failed with status ${res.status}`,
        );
      }

      const data = await res.json();
      if (data.snapshot) {
        setSnapshot(data.snapshot);
      } else {
        await loadSnapshot();
      }
      setNotice("Confirmation document uploaded successfully.");
      toast.success("Confirmation document uploaded successfully.");
    } catch (err: any) {
      console.error("Positive doc upload error:", err);
      const msg = err.message || "Unable to upload confirmation document.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const submitHelpRequest = () => {
    if (!activeEnrollment || !helpMessage.trim()) return;
    runAction(async () => {
      await fetch(`/api/user/${userId}/positive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "help",
          enrollmentId: activeEnrollment.id,
          enrollmentName: activeEnrollment.name,
          message: helpMessage,
        }),
      });
      setHelpMessage("");
    }, "Help request submitted to your credit coach.");
  };

  if (loading && !snapshot) {
    return (
      <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Loading your credit-building plan…
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Analyzing connected credit report accounts, utilization ratios, and
          verified providers.
        </p>
      </div>
    );
  }

  const primaryUtil = report
    ? utilization(report.accounts, bureau, "primary")
    : null;
  const isHighUtil = (primaryUtil?.percent ?? 0) >= 30;

  return (
    <div className="space-y-6 text-gray-900">
      {/* Top Navigation / Sub-Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold tracking-wider text-blue-600 uppercase">
              YOUR PERSONAL CREDIT-BUILDING PLAN
            </span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {report
                ? "Make your credit profile work harder."
                : "Your next step starts with your report."}
            </h2>
            <p className="text-sm text-gray-500">
              One personalized path. The right accounts, clear setup
              instructions, and progress you can follow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {snapshot?.canAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminModal(true)}
                className="h-9 px-3.5 gap-2 text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50/60 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 shadow-sm transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Knowledge Base Admin
              </Button>
            )}
          </div>
        </div>

        {snapshot?.demo && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Interactive mode with verified provider catalog. No real accounts
              opened without your explicit application.
            </span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              onClick={loadSnapshot}
              className="h-7 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        )}

        {notice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* When no live report exists yet */}
      {!report && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Connect Your 3-Bureau Credit Report
            </h3>
            <p className="text-xs text-gray-500">
              Pull your live credit report across Experian, Equifax, and
              TransUnion from the crs-report-data collection to generate your
              personalized credit-building plan.
            </p>
          </div>
        </div>
      )}

      {/* Credit Scores & Refresh Row */}
      {report && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Credit Scores
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Across all three bureaus · Click any bureau to view personalized
                plan
              </p>
            </div>
          </div>

          {/* Bureau gauge cards in order matching Home Page: Equifax, TransUnion, Experian */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayBureaus.map((b) => {
              const sc = report.scores.find((x) => x.bureau === b);
              const isActive = bureau === b;
              const currentScore = sc?.value || 0;
              const delta = sc?.delta || 0;
              const prevScore =
                sc?.prevScore !== undefined
                  ? sc.prevScore
                  : currentScore
                    ? currentScore - delta
                    : 0;
              const min = 300;
              const max = 850;
              const pct =
                currentScore > 0
                  ? Math.max(0, Math.min(1, (currentScore - min) / (max - min)))
                  : 0;
              const angle = -180 + pct * 180;
              const pulledDateFormatted = sc?.pulledAt
                ? fmtPulled(sc.pulledAt)
                : fmtPulled(report.pulledAt);

              return (
                <div
                  key={b}
                  onClick={() => setBureau(b)}
                  className={`rounded-2xl border p-6 flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                    isActive
                      ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/30"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:border-gray-300 hover:shadow"
                  }`}
                >
                  {/* Selected Active Indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      <Check className="w-3 h-3" />
                      Active Plan
                    </div>
                  )}

                  {/* Bureau Logo */}
                  <div className="h-8 flex items-center justify-center mb-6 mt-1">
                    <Image
                      src={bureauLogos[b]}
                      alt={bureauLabels[b]}
                      width={100}
                      height={32}
                      className="object-contain h-full w-auto"
                    />
                  </div>

                  {/* Gauge and Score */}
                  <div className="relative w-full max-w-[200px] aspect-[2/1] mb-8 mx-auto">
                    <svg
                      viewBox="0 0 200 100"
                      className="w-full h-full overflow-visible"
                    >
                      <defs>
                        <linearGradient
                          id={`gaugeGradient-${b}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="25%" stopColor="#ef4444" />
                          <stop offset="25%" stopColor="#f59e0b" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="75%" stopColor="#3b82f6" />
                          <stop offset="75%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>

                      {/* Colored track */}
                      <path
                        d="M 10 90 A 90 90 0 0 1 190 90"
                        fill="none"
                        stroke={`url(#gaugeGradient-${b})`}
                        strokeWidth="10"
                        strokeLinecap="round"
                      />

                      {/* Marker */}
                      {currentScore > 0 && (
                        <g transform={`translate(100, 90) rotate(${angle})`}>
                          <circle
                            cx="90"
                            cy="0"
                            r="5"
                            fill="#fff"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                        </g>
                      )}
                    </svg>

                    {/* Inside the arc content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-none">
                        {currentScore > 0 ? currentScore : "—"}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                        {pulledDateFormatted}
                      </div>
                    </div>

                    {/* 300 and 850 labels */}
                    <div className="absolute -bottom-2 left-0 text-xs font-bold text-gray-600 dark:text-gray-400 -translate-x-2 translate-y-full">
                      300
                    </div>
                    <div className="absolute -bottom-2 right-0 text-xs font-bold text-gray-600 dark:text-gray-400 translate-x-2 translate-y-full">
                      850
                    </div>
                  </div>

                  {/* Delta & Previous Score */}
                  <div className="text-center mt-2">
                    <div
                      className={`text-3xl sm:text-4xl font-extrabold leading-none tracking-tight mb-2 ${
                        delta > 0
                          ? "text-emerald-500"
                          : delta < 0
                            ? "text-red-500"
                            : "text-gray-400"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </div>
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Prev Score: {prevScore}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Baseline summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                Here’s where you are today
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {
                  report.accounts.filter(
                    (a) =>
                      a.positive &&
                      a.ownership === "primary" &&
                      a.kind === "revolving",
                  ).length
                }{" "}
                primary revolving ·{" "}
                {
                  report.accounts.filter(
                    (a) =>
                      a.positive &&
                      a.ownership === "primary" &&
                      a.kind === "installment",
                  ).length
                }{" "}
                installment accounts
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Own-card utilization:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {percent(primaryUtil?.percent ?? null)}
                </strong>{" "}
                · {currency(primaryUtil?.balance ?? null)} in revolving balances
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  Positive Reporting on {bureau.toUpperCase()}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Active tradelines with zero derogatory flags on record
                </p>
              </div>
              <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {
                  report.accounts.filter(
                    (a) => a.positive && a.bureaus.includes(bureau),
                  ).length
                }
              </span>
            </div>
          </div>

          {/* Dispute Link if Negatives exist */}
          {report.negativeCount > 0 && (
            <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  {report.negativeCount} negative item
                  {report.negativeCount > 1 ? "s" : ""} need an accuracy review
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300">
                  {snapshot.context.paidDisputes
                    ? (snapshot.disputeStatus ?? "CEG Dispute tracking active.")
                    : "Review inaccuracies before applying for funding."}
                </div>
              </div>
              {snapshot.context.paidDisputes && (
                <a
                  href={disputeUrl}
                  className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1"
                >
                  View CEG Dispute <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Utilization Impact Panel (If High Utilization or AU picks exist) */}
      {report && (
        <UtilizationPanelComponent
          report={report}
          bureau={bureau}
          picks={chosenProviders.filter((p) => p.category === "au")}
          onShowMethodology={() => setShowMethodologyModal(true)}
          compact={!isHighUtil}
        />
      )}

      {/* Path Forward: 6-Category Plan Steps */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Here&apos;s Your Path Forward
            </h3>
            <p className="text-xs text-gray-500">
              {plan?.steps.reduce((n, x) => n + x.quantity, 0) ?? 0} suggested
              additions tailored for this report.
            </p>
          </div>
          {snapshot?.enrollments.length === 0 && (
            <Button
              size="sm"
              disabled={busy || addingAU}
              onClick={async () => {
                setAddingAU(true);
                try {
                  await runAction(
                    () =>
                      fetch(`/api/user/${userId}/positive`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "seed" }),
                      }),
                    "Recommended AU Tradeline candidate added to plan.",
                  );
                } finally {
                  setAddingAU(false);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {addingAU ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Adding AU Recommendation...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Coach AU Recommendation
                </>
              )}
            </Button>
          )}
        </div>

        {/* Holds warning box if any holds are active */}
        {plan && plan.holds.length > 0 && (
          <details className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs">
            <summary className="font-bold text-amber-900 dark:text-amber-300 cursor-pointer flex items-center justify-between">
              <span>What we’re watching before you add accounts</span>
              <span className="text-[10px] uppercase font-bold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded">
                {plan.holds.length} Considerations
              </span>
            </summary>
            <div className="mt-3 space-y-1.5 text-amber-800 dark:text-amber-400 pl-2 border-l-2 border-amber-300">
              {plan.holds.map((h, i) => (
                <p key={i}>• {h}</p>
              ))}
            </div>
          </details>
        )}

        {/* Steps List / Accordions */}
        <div className="space-y-3">
          {plan?.steps.map((step, idx) => {
            const isOpen = openCategory === step.category;
            const Icon = categoryIcons[step.category] || TrendingUp;
            const selectedForCategory =
              snapshot?.enrollments.filter(
                (e) => e.category === step.category,
              ) || [];

            return (
              <div
                key={step.category}
                className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenCategory(isOpen ? null : step.category)}
                  className={`w-full p-4 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    isOpen
                      ? "bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40"
                      : "bg-white dark:bg-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span>
                          {step.quantity} {labels[step.category]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {step.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedForCategory.length > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        {selectedForCategory.length} Selected
                      </span>
                    )}
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Plus className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-5 bg-white dark:bg-gray-900 space-y-5">
                    {/* Guidance / instructions box */}
                    {step.instructions.length > 0 && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 space-y-2">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          CEG Admin Guidance · Version {step.ruleVersion || 1}
                        </div>
                        <ol className="list-decimal list-inside text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {step.instructions.map((inst, i) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Active Selected Enrollments for this category */}
                    {selectedForCategory.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Active Account Enrollments:
                        </div>
                        {selectedForCategory.map((e) => (
                          <div
                            key={e.id}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between flex-wrap gap-3"
                          >
                            <div>
                              <div className="font-semibold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                                {e.name}
                                {e.helpRequested && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                                    Help Requested
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                Current Stage:{" "}
                                <strong className="text-blue-600 uppercase">
                                  {displayStage[e.stage]}
                                </strong>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setActiveEnrollmentId(e.id);
                                setHelpMessage("");
                              }}
                              className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                            >
                              Continue Setup{" "}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Choose / Review choices button */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setPickerChoices(
                            selectedForCategory.map((e) => e.providerId),
                          );
                          setPickerCategory(step.category);
                        }}
                        className="text-xs font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {selectedForCategory.length
                          ? "Review My Choices"
                          : "Choose What Works For Me"}{" "}
                        →
                      </Button>
                      {step.category === "bills" && (
                        <p className="text-[11px] text-gray-500 max-w-md">
                          Experian Boost & eCredable report verified bills you
                          already pay. Confirm each service before adding.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Projection & Estimated Post-Plan Profile */}
      {report && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {(plan?.steps.length ?? 0) + 1}. Your Profile After This Plan
              </h3>
              <p className="text-xs text-gray-500">
                Assuming approval and verified bureau reporting
              </p>
            </div>
          </div>

          {/* Simulator Box */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
            <div className="text-xs text-blue-800 dark:text-blue-300 font-semibold">
              {bureau.toUpperCase()} · {score?.model ?? "FICO Score 8"}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900 dark:text-white">
                {score?.value ?? "—"}
              </span>
              <span className="text-xs font-bold text-blue-600">now →</span>
              <span className="text-3xl font-black text-indigo-700 dark:text-indigo-400">
                {estimate?.available
                  ? `${estimate.low}–${estimate.high}`
                  : "Estimate Available"}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {estimate?.available
                ? `Scenario model supplied by ${estimate.provider}. Score impact is estimated and individual account effects are non-linear.`
                : "The utilization changes below are calculated mathematically. Realized bureau points depend on full profile history."}
            </p>
          </div>

          {/* Projection Table */}
          <ProjectionTableComponent
            report={report}
            picks={chosenProviders}
            bureau={bureau}
          />

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Proposed options fill unselected steps. Totals update with your
            selections. AU limits remain separate from personal revolving lines;
            rent and utility reporting add positive payment streaks without
            added debt.
          </p>
        </div>
      )}

      {/* SMS Coaching Consent Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            CEG Account Setup Coaching
          </h4>
          <p className="text-xs text-gray-500">
            {snapshot?.context.paidCoaching
              ? "We track your next milestone and remind you when documents or verification need attention."
              : "Account setup tracking and milestone reminders are active on your profile."}
          </p>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={snapshot?.context.smsConsent ?? false}
              disabled={busy}
              onChange={(e) =>
                runAction(
                  () =>
                    fetch(`/api/user/${userId}/positive`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "consent",
                        enabled: e.target.checked,
                      }),
                    }),
                  "SMS reminder preferences updated.",
                )
              }
              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Text me account-setup reminders and statement dates
            </span>
          </label>
          <p className="text-[10px] text-gray-400">
            Message and data rates may apply. Reply STOP to opt out. TCPA quiet
            hours enforced.
          </p>
        </div>
      </div>

      {/* --- MODAL 1: Provider Picker Modal --- */}
      {pickerCategory && snapshot && report && (() => {
        const CategoryIcon = categoryIcons[pickerCategory] || Award;
        const categoryStep = plan?.steps.find((x) => x.category === pickerCategory);
        const suggestedMax = categoryStep?.quantity ?? 1;
        const isOverLimit = pickerChoices.length > suggestedMax;
        const availableProviders =
          pickerCategory === "au"
            ? plan?.au.map((x) => x.provider) || []
            : snapshot.providers.filter(
                (p) =>
                  p.category === pickerCategory &&
                  isCurrentProvider(p, now, snapshot.demo) &&
                  p.bureaus.includes(bureau),
              );

        return (
          <Modal
            title={`Choose ${labels[pickerCategory]}`}
            subtitle={
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                  <CategoryIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {labels[pickerCategory]}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Plan Target: {bureauLabels[bureau]} · Max recommended: {suggestedMax}
                </span>
              </div>
            }
            onClose={() => setPickerCategory(null)}
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4">
              {/* Trust & Guidance Notice Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    Zero upfront commitment.
                  </span>{" "}
                  Selecting an account adds its step-by-step setup guide to your action plan. You apply directly with the provider when you&apos;re ready.
                </div>
              </div>

              {/* Provider Options List */}
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {availableProviders.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
                    <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      No additional providers available
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      All verified options for this category are already in your active plan.
                    </p>
                  </div>
                ) : (
                  availableProviders.map((p) => {
                    const impact =
                      pickerCategory === "au"
                        ? auImpact(report, bureau, [p])
                        : null;
                    const isSelected = pickerChoices.includes(p.id);
                    const isEnrolled = snapshot.enrollments.some(
                      (e) => e.providerId === p.id,
                    );

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isEnrolled || busy) return;
                          setPickerChoices(
                            isSelected
                              ? pickerChoices.filter((x) => x !== p.id)
                              : [...pickerChoices, p.id],
                          );
                        }}
                        className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 select-none ${
                          isEnrolled
                            ? "opacity-65 bg-gray-50/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 cursor-not-allowed"
                            : isSelected
                              ? "bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-gray-900 dark:to-blue-950/20 border-blue-600 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20 cursor-pointer"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xs cursor-pointer"
                        }`}
                      >
                        {/* Header: Checkbox + Brand Info + Pricing */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5 min-w-0">
                            {/* Custom Checkbox Indicator */}
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
                                isEnrolled
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                  : isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xs scale-105"
                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-blue-400"
                              }`}
                            >
                              {(isSelected || isEnrolled) && (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              )}
                            </div>

                            {/* Brand Avatar & Name */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white tracking-tight">
                                  {p.name}
                                </h4>
                                {isEnrolled && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    Active in Plan
                                  </span>
                                )}
                              </div>
                              {p.eligibility && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                                  {p.eligibility}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Pricing Badge */}
                          <div className="text-right flex-shrink-0 pl-2">
                            {p.monthlyCost !== null && p.monthlyCost !== undefined ? (
                              <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight">
                                {p.monthlyCost === 0 ? "Free" : currency(p.monthlyCost)}
                                {p.monthlyCost > 0 && (
                                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                    {" "}
                                    / mo
                                  </span>
                                )}
                              </div>
                            ) : null}
                            {p.setupCost !== null && p.setupCost !== undefined && (
                              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                {p.setupCost === 0
                                  ? "No setup fee"
                                  : `${currency(p.setupCost)} upfront`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* AU Impact Metrics Panel (Only for AU accounts) */}
                        {impact && (
                          <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div className="bg-gray-50/80 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-wider">
                                Credit Limit
                              </span>
                              <strong className="text-sm font-extrabold text-gray-900 dark:text-white">
                                {currency(p.limit)}
                              </strong>
                            </div>
                            <div className="bg-gray-50/80 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-wider">
                                Reported Balance
                              </span>
                              <strong className="text-sm font-extrabold text-gray-900 dark:text-white">
                                {currency(p.balance)}
                              </strong>
                            </div>
                            <div className="col-span-2 sm:col-span-1 bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center">
                              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block uppercase font-bold tracking-wider">
                                Combined Util Impact
                              </span>
                              <strong className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                                {percent(impact.before)} → {percent(impact.after)}
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* Metadata Footer: Bureau reporting + Verification date */}
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              Reports to:
                            </span>
                            {p.bureaus.map((bKey) => (
                              <span
                                key={bKey}
                                className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-semibold text-[10px] text-gray-700 dark:text-gray-300 tracking-wider uppercase border border-gray-200/60 dark:border-gray-700/60"
                              >
                                {bureauLabels[bKey] || bKey}
                              </span>
                            ))}
                          </div>
                          {p.verifiedAt && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Verified: {shortDate(p.verifiedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Action Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                      isOverLimit
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : pickerChoices.length > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {pickerChoices.length > 0 && !isOverLimit && (
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    )}
                    {isOverLimit && <AlertCircle className="w-3 h-3 text-rose-600" />}
                    <span>{pickerChoices.length} selected</span>
                    <span className="opacity-60 font-normal">
                      · suggested max {suggestedMax}
                    </span>
                  </div>
                  {isOverLimit && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      Please unselect {pickerChoices.length - suggestedMax} to match plan quota
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setPickerCategory(null)}
                    className="h-9 px-3.5 text-xs font-semibold gap-1.5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      busy ||
                      pickerChoices.length === 0 ||
                      isOverLimit
                    }
                    onClick={() =>
                      runAction(async () => {
                        await fetch(`/api/user/${userId}/positive`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "select",
                            category: pickerCategory,
                            ids: pickerChoices,
                            bureau,
                            reportId: report?.id || "default",
                          }),
                        });
                        setPickerCategory(null);
                      }, "Choices saved. Begin the first registration step.")
                    }
                    className="h-9 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save My Choices
                        <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* --- MODAL 2: Enrollment Detail & Stepper Action Modal --- */}
      {activeEnrollment && (
        <Modal
          title={activeEnrollment.name}
          subtitle={
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                {(() => {
                  const Icon =
                    categoryIcons[activeEnrollment.category] || Award;
                  return (
                    <Icon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  );
                })()}
                {labels[activeEnrollment.category]}
              </span>
              {activeProvider?.limit !== null &&
                activeProvider?.limit !== undefined && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {currency(activeProvider.limit)} Limit
                  </span>
                )}
              {activeProvider?.monthlyCost !== null &&
                activeProvider?.monthlyCost !== undefined && (
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {activeProvider.monthlyCost === 0
                      ? "No monthly fee"
                      : `${currency(activeProvider.monthlyCost)} / mo`}
                  </span>
                )}
              {activeProvider?.bureaus && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                  · Reports to:{" "}
                  {activeProvider.bureaus
                    .map((b) => bureauLabels[b] || b)
                    .join(", ")}
                </span>
              )}
            </div>
          }
          onClose={() => {
            setActiveEnrollmentId(null);
            setHelpMessage("");
          }}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* 6-Stage Progress Stepper */}
            <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              {/* Mobile Progress Bar (< sm) */}
              <div className="block sm:hidden space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px]">
                    {stageMeta[activeEnrollment.stage]?.badgeText || "Progress"}
                  </span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                    {displayStage[activeEnrollment.stage]}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((stages.indexOf(activeEnrollment.stage) + 1) /
                          stages.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Desktop Stepper (sm and above) */}
              <div className="hidden sm:grid grid-cols-6 gap-1 relative">
                {stages.map((st, i) => {
                  const currentIdx = stages.indexOf(activeEnrollment.stage);
                  const isComplete = i < currentIdx;
                  const isCurrent = i === currentIdx;

                  return (
                    <div
                      key={st}
                      className="flex flex-col items-center text-center relative group"
                    >
                      {/* Connector line behind circles */}
                      {i > 0 && (
                        <div
                          className={`absolute top-3.5 -left-1/2 w-full h-0.5 -z-0 transition-colors ${
                            i <= currentIdx
                              ? "bg-emerald-500 dark:bg-emerald-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      )}

                      {/* Circle indicator */}
                      <div
                        className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100 dark:ring-blue-950 scale-105"
                            : isComplete
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>

                      {/* Stage Name */}
                      <span
                        className={`mt-2 text-[10px] font-semibold leading-tight line-clamp-2 transition-colors ${
                          isCurrent
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : isComplete
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {stageMeta[st]?.shortLabel || displayStage[st]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Banner */}
            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                {activeEnrollment.stage === "waiting" ? (
                  <Clock className="w-4 h-4" />
                ) : activeEnrollment.stage === "posted" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : activeEnrollment.stage === "registered" ? (
                  <Upload className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    {stageMeta[activeEnrollment.stage]?.title ||
                      `Current Status: ${displayStage[activeEnrollment.stage]}`}
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {stageMeta[activeEnrollment.stage]?.badgeText || "Active"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {activeEnrollment.stage === "waiting"
                    ? "We monitor your next credit report pull for this line. Bureau matching occurs on statement close."
                    : activeEnrollment.stage === "posted"
                      ? "This account has posted and matched directly to your 3-bureau report."
                      : stageMeta[activeEnrollment.stage]?.description ||
                        "Complete provider setup requirements, then confirm progress below."}
                </p>
              </div>
            </div>

            {/* Provider Guidance Instructions Card */}
            {activeGuidance.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Verified Setup Instructions
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md">
                    {activeRule?.instructions?.length
                      ? `CEG Guidance · v${activeRule.version}`
                      : `Provider Standard · v${
                          activeProvider?.version ??
                          activeEnrollment.providerVersion
                        }`}
                  </span>
                </div>
                <div className="p-4 space-y-2.5">
                  {activeGuidance.map((inst, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="flex-1 pt-0.5">{inst}</span>
                    </div>
                  ))}

                  {activeProvider?.eligibility && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-start gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Eligibility Note:</strong>{" "}
                        {activeProvider.eligibility}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Official Provider Portal Link Card */}
            {activeProvider?.url && (
              <a
                href={activeProvider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      Open Official {activeEnrollment.name} Portal
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Complete registration directly on provider website
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Visit Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </a>
            )}

            {/* Stage-Specific Action: Upload Document */}
            {(activeEnrollment.stage === "registered" ||
              activeEnrollment.documentPath) && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Registration Documentation
                    </span>
                  </div>
                  {uploadingDoc ? (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                      Uploading...
                    </span>
                  ) : activeEnrollment.documentPath ? (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Required
                    </span>
                  )}
                </div>

                {activeEnrollment.documentPath ? (
                  <div
                    className={`p-3 bg-white dark:bg-gray-900 rounded-lg border transition-all flex items-center justify-between flex-wrap gap-2 ${
                      uploadingDoc
                        ? "border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs"
                        : "border-emerald-200 dark:border-emerald-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          uploadingDoc
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600"
                        }`}
                      >
                        {uploadingDoc ? (
                          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {uploadingDoc
                            ? "Replacing Document..."
                            : "Confirmation On File"}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[200px] sm:max-w-xs">
                          {uploadingDoc
                            ? "Uploading new verification file to server..."
                            : activeEnrollment.documentPath.split("/").pop()}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy || uploadingDoc}
                      className="h-7 px-2.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-60"
                    >
                      {uploadingDoc ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin mr-1 text-blue-600" />
                          Uploading...
                        </>
                      ) : (
                        "Replace"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDraggingFile
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-900"
                    }`}
                  >
                    {uploadingDoc ? (
                      <div className="py-2 flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Uploading confirmation document...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Upload Redacted Registration Confirmation
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Drag and drop or click to browse · PDF, JPG, or PNG
                          under 10MB
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Do not upload unredacted passwords or full card
                          credentials.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={busy || uploadingDoc}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="hidden"
                />
              </div>
            )}

            {/* Stage Advancement Button */}
            {stages.indexOf(activeEnrollment.stage) < 4 && (
              <div className="space-y-1.5 pt-1">
                <Button
                  className="w-full h-11 text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all rounded-xl cursor-pointer"
                  disabled={
                    busy ||
                    uploadingDoc ||
                    (activeEnrollment.stage === "registered" &&
                      !activeEnrollment.documentPath)
                  }
                  onClick={() => {
                    const nextIndex =
                      stages.indexOf(activeEnrollment.stage) + 1;
                    const nextStage = stages[nextIndex];
                    runAction(async () => {
                      await fetch(`/api/user/${userId}/positive`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "advance",
                          enrollmentId: activeEnrollment.id,
                          version: activeEnrollment.version,
                          nextStage,
                        }),
                      });
                    }, `Milestone advanced to ${displayStage[nextStage]}`);
                  }}
                >
                  {busy ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating Milestone...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {activeEnrollment.stage === "selected"
                        ? "I Registered Directly →"
                        : activeEnrollment.stage === "registered"
                          ? "Confirm Documents Uploaded →"
                          : activeEnrollment.stage === "documents"
                            ? "Payment Complete / Ready →"
                            : "Setup Complete; Wait for Reporting →"}
                    </>
                  )}
                </Button>

                {activeEnrollment.stage === "registered" &&
                  !activeEnrollment.documentPath && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1.5 pt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Please upload your registration confirmation above to
                        continue.
                      </span>
                    </div>
                  )}
              </div>
            )}

            {/* Help Request Drawer */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Need Help with this Step?
                  </span>
                </div>
                {activeEnrollment.helpRequested && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Request Pending
                  </span>
                )}
              </div>

              {activeEnrollment.helpRequested ? (
                <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[11px]">
                      Help Request Under Review
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Your question has been dispatched to your CEG Credit Coach
                      desk. A specialist will review your account.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Quick Prompt Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "When is the statement cut date?",
                      "How do I confirm AU addition?",
                      "When will this report to Experian?",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setHelpMessage(chip)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Ask coach: e.g. When is the statement cut date?"
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && helpMessage.trim() && !busy) {
                          e.preventDefault();
                          submitHelpRequest();
                        }
                      }}
                      className="text-xs h-9 bg-white dark:bg-gray-900"
                    />
                    <Button
                      size="sm"
                      disabled={busy || !helpMessage.trim()}
                      onClick={submitHelpRequest}
                      className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 disabled:pointer-events-none transition-all flex-shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Submit</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* --- MODAL 3: Methodology Explanation Modal --- */}
      {showMethodologyModal && (
        <Modal
          title="Why Revolving Utilization Matters"
          onClose={() => setShowMethodologyModal(false)}
        >
          <div className="space-y-4 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              When high utilization holds a profile back, reducing it can
              meaningfully improve FICO scores. A suitable high-limit,
              low-balance authorized-user account lowers combined reported
              utilization across bureaus.
            </p>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-[11px]">
              <strong>Aggregate Utilization Formula:</strong>
              <div className="mt-1 text-blue-600 dark:text-blue-400">
                (Primary Balances + AU Balances) ÷ (Primary Limits + AU Limits)
                × 100
              </div>
            </div>
            <p>
              Your own card balances and individual-card utilization remain
              unchanged. Paying down primary cards remains critical for
              underwriting approval.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
              <a
                href={sources.au}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Experian: Authorized User Accounts & Utilization{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={sources.fico}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                myFICO: Authorized User Impact and Scoring Models{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* --- MODAL 4: Admin Knowledge Base Modal --- */}
      {showAdminModal && snapshot && (
        <AdminModalComponent
          snapshot={snapshot}
          userId={userId}
          onClose={() => {
            setShowAdminModal(false);
            loadSnapshot();
          }}
        />
      )}
    </div>
  );
}

/**
 * Utilization Panel Component with Visual Comparison Bars
 */
function UtilizationPanelComponent({
  report,
  bureau,
  picks,
  compact = false,
  onShowMethodology,
}: {
  report: CreditReport;
  bureau: Bureau;
  picks: Provider[];
  compact?: boolean;
  onShowMethodology: () => void;
}) {
  const u = auImpact(report, bureau, picks);

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition-all ${
        compact
          ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
          : "bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900/60"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-blue-600">
            AUTHORIZED-USER UTILIZATION IMPACT · {bureau.toUpperCase()}
          </span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {(u.reduction ?? 0) > 0
              ? "Less of your reported credit in use."
              : "Start with a clearer view of utilization."}
          </h3>
        </div>
      </div>

      {/* Metric Comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200/60 dark:border-gray-800">
        <div>
          <span className="text-[10px] text-gray-500 block uppercase font-bold">
            Combined Today
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white">
            {percent(u.before)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 block uppercase font-bold">
            With {u.addedCount || "Selected"} AU Account
            {u.addedCount === 1 ? "" : "s"}
          </span>
          <span className="text-2xl font-black text-emerald-600">
            {percent(u.after)}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] text-gray-500 block uppercase font-bold">
            Simulated Reduction
          </span>
          <span className="text-2xl font-black text-indigo-600">
            {u.reduction !== null && u.reduction > 0
              ? `${u.reduction.toFixed(1)} percentage pts lower`
              : "—"}
          </span>
        </div>
      </div>

      {/* Comparative Progress Bars */}
      <div className="space-y-2 mt-4">
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            <span>Now (Without AU)</span>
            <span>{percent(u.before)}</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${Math.min(u.before ?? 0, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            <span>With AU Tradeline</span>
            <span className="text-emerald-600">{percent(u.after)}</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(u.after ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Own cards explanation */}
      <div className="mt-4 p-3 bg-white/60 dark:bg-gray-800/50 rounded-xl text-xs text-gray-600 dark:text-gray-300">
        <strong>Your own cards stay at {percent(u.primary)}.</strong> Their{" "}
        {currency(u.primaryBalance)} balance does not change. Paying balances
        down remains essential.
      </div>

      <button
        onClick={onShowMethodology}
        className="mt-3 text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
      >
        See the calculation and score considerations →
      </button>
    </div>
  );
}

/**
 * Projected Profile Comparison Table Component
 */
function ProjectionTableComponent({
  report,
  picks,
  bureau,
}: {
  report: CreditReport;
  picks: Provider[];
  bureau: Bureau;
}) {
  const t = totals(report, picks, bureau);
  const u = auImpact(
    report,
    bureau,
    picks.filter((p) => p.category === "au"),
  );

  const rows: [string, string | number, string | number][] = [
    ["Positive-reporting accounts", t.now, t.after],
    ["Primary credit accounts", t.primaryNow, t.primaryAfter],
    ["Authorized-user accounts", t.auNow, t.auAfter],
    [
      "Primary revolving / installment",
      `${
        report.accounts.filter(
          (a) =>
            a.ownership === "primary" &&
            a.positive &&
            a.kind === "revolving" &&
            a.bureaus.includes(bureau),
        ).length
      } / ${
        report.accounts.filter(
          (a) =>
            a.ownership === "primary" &&
            a.positive &&
            a.kind === "installment" &&
            a.bureaus.includes(bureau),
        ).length
      }`,
      `${t.revolvingAfter} / ${t.installmentAfter}`,
    ],
    [
      "Primary revolving limits",
      currency(t.primaryLimitNow),
      currency(t.primaryLimitAfter),
    ],
    [
      "AU reported limits (separate)",
      currency(t.auLimitNow),
      currency(t.auLimitAfter),
    ],
    [
      "Combined reported limits",
      currency(
        t.primaryLimitNow === null || t.auLimitNow === null
          ? null
          : t.primaryLimitNow + t.auLimitNow,
      ),
      currency(
        t.primaryLimitAfter === null || t.auLimitAfter === null
          ? null
          : t.primaryLimitAfter + t.auLimitAfter,
      ),
    ],
    [
      "Combined utilization (AU effect only)",
      percent(u.before),
      percent(u.after),
    ],
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 uppercase">
          <tr>
            <th className="py-3 px-4">Your Profile</th>
            <th className="py-3 px-4">Now</th>
            <th className="py-3 px-4 text-blue-600">After Additions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
          {rows.map(([name, nowVal, afterVal]) => (
            <tr
              key={name}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
            >
              <td className="py-2.5 px-4 font-medium">{name}</td>
              <td className="py-2.5 px-4 text-gray-500">{nowVal}</td>
              <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white">
                {afterVal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Admin Knowledge Base & Provider Management Modal Component
 */
function AdminModalComponent({
  snapshot,
  userId,
  onClose,
}: {
  snapshot: Snapshot;
  userId: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"providers" | "rules">("providers");
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const saveProvider = async (p: Provider) => {
    try {
      await fetch(`/api/user/${userId}/positive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publishProvider", provider: p }),
      });
      toast.success("Provider catalog updated.");
      setEditingProvider(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const saveRule = async (r: Rule) => {
    try {
      await fetch(`/api/user/${userId}/positive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publishRule", rule: r }),
      });
      toast.success("Setup rule updated.");
      setEditingRule(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      title="CEG Credit Knowledge Base Administration"
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        <div className="flex gap-2 border-b pb-2">
          <Button
            size="sm"
            onClick={() => setTab("providers")}
            className={`text-xs font-semibold cursor-pointer ${
              tab === "providers"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            }`}
          >
            Provider Library ({snapshot.providers.length})
          </Button>
          <Button
            size="sm"
            onClick={() => setTab("rules")}
            className={`text-xs font-semibold cursor-pointer ${
              tab === "rules"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            }`}
          >
            Priority Rules ({snapshot.rules.length || categories.length})
          </Button>
        </div>

        {tab === "providers" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">
                Configured Lenders & Tradelines
              </span>
              <Button
                size="sm"
                onClick={() =>
                  setEditingProvider({
                    id: `provider-${Date.now()}`,
                    name: "",
                    category: "au",
                    url: "https://",
                    sourceUrl: "https://",
                    status: "published",
                    version: 1,
                    instructions: [
                      "Verify eligibility directly with provider.",
                    ],
                    verifiedAt: new Date().toISOString(),
                    reviewAfter: new Date(
                      Date.now() + 365 * 86400000,
                    ).toISOString(),
                    monthlyCost: 0,
                    setupCost: 0,
                    limit: 10000,
                    balance: 200,
                    originalPrincipal: null,
                    openedAt: new Date().toISOString(),
                    bureaus: ["experian", "equifax", "transunion"],
                    issuerPermissionConfirmed: true,
                    onTimeHistoryConfirmed: true,
                    graduationPathVerified: false,
                    eligibility: "Verified US applicant",
                    historicalReporting: "100% on-time history",
                    exclusiveGroup: null,
                    sample: false,
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Provider
              </Button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {snapshot.providers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <strong className="text-gray-900">{p.name}</strong>
                    <div className="text-gray-500 text-[11px]">
                      Category: {labels[p.category]} · Status: {p.status} ·
                      Limit: {currency(p.limit)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingProvider(p)}
                    className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 cursor-pointer"
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>

            {editingProvider && (
              <div className="p-4 bg-gray-50 rounded-xl border space-y-3">
                <h4 className="font-bold">
                  Edit Provider: {editingProvider.name || "New Provider"}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Provider Name"
                    value={editingProvider.name}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        name: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Portal URL"
                    value={editingProvider.url}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        url: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Limit"
                    type="number"
                    value={editingProvider.limit ?? ""}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        limit: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Input
                    placeholder="Balance"
                    type="number"
                    value={editingProvider.balance ?? ""}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        balance: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProvider(null)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveProvider(editingProvider)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Provider
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "rules" && (
          <div className="space-y-3">
            <span className="font-bold text-gray-700">
              Category Rules & Additions
            </span>
            {categories.map((c) => {
              const rule = snapshot.rules.find((r) => r.category === c);
              return (
                <div
                  key={c}
                  className="p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <strong className="text-gray-900">{labels[c]}</strong>
                    <div className="text-gray-500 text-[11px]">
                      Max Additions: {rule?.maxAdditions ?? 2} · Status:{" "}
                      {rule?.status ?? "default published"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingRule(
                        rule || {
                          id: c,
                          category: c,
                          version: 1,
                          status: "published",
                          maxAdditions: 2,
                          instructions: [
                            "Follow verified provider instructions.",
                          ],
                          reason: "CEG reviewed guidance.",
                        },
                      )
                    }
                    className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 cursor-pointer"
                  >
                    Edit Rule
                  </Button>
                </div>
              );
            })}

            {editingRule && (
              <div className="p-4 bg-gray-50 rounded-xl border space-y-3">
                <h4 className="font-bold">
                  Edit Rule for {labels[editingRule.category]}
                </h4>
                <Input
                  placeholder="Reasoning shown to client"
                  value={editingRule.reason}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, reason: e.target.value })
                  }
                />
                <Input
                  placeholder="Max additions (0 pauses)"
                  type="number"
                  value={editingRule.maxAdditions}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      maxAdditions: Number(e.target.value),
                    })
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRule(null)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveRule(editingRule)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Rule
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

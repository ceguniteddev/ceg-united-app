"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  X,
  Check,
  Scale,
  Eye,
  Sparkles,
  ExternalLink,
  Mail,
  Bell,
  ArrowRight,
  FileCheck,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  todayISO,
  diffDays,
  evidenceFor,
  selectNextSteps,
  type DisputeSnapshot,
  type DisputeLine,
  type AuditItem,
  type LetterDoc,
  type Bureau,
  type Stage,
  type Locale,
} from "@/lib/disputes/core";

// ============================================================================
// Bureau & Stage Configuration
// ============================================================================

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

const stageNames: Record<Stage, { name: string; desc: string; color: string }> =
  {
    S0: {
      name: "Audit & Intake",
      desc: "Detecting errors and gathering evidence",
      color: "bg-blue-100 text-blue-800",
    },
    S1: {
      name: "Letter Drafting",
      desc: "Statutory dispute letters compiled and ready to sign",
      color: "bg-indigo-100 text-indigo-800",
    },
    S2: {
      name: "Dispatched",
      desc: "Mailed via USPS Certified Mail",
      color: "bg-amber-100 text-amber-800",
    },
    S3: {
      name: "Clock Running",
      desc: "30-day statutory investigation period active",
      color: "bg-cyan-100 text-cyan-800",
    },
    S4: {
      name: "Report Check",
      desc: "Bureau reviewing furnisher updates",
      color: "bg-purple-100 text-purple-800",
    },
    S5: {
      name: "Response Processing",
      desc: "Investigation results received and undergoing OCR",
      color: "bg-sky-100 text-sky-800",
    },
    S6: {
      name: "Next Action",
      desc: "Evaluation of next statutory step or demand",
      color: "bg-orange-100 text-orange-800",
    },
    S7: {
      name: "Case Readiness",
      desc: "Potential FCRA violation flagged for attorney review",
      color: "bg-rose-100 text-rose-800",
    },
    S8: {
      name: "Resolved / Deleted",
      desc: "Item deleted or corrected; 90-day reinsertion watch active",
      color: "bg-emerald-100 text-emerald-800",
    },
    S9: {
      name: "Formal Complaint",
      desc: "CFPB or regulatory complaint filed",
      color: "bg-red-100 text-red-800",
    },
    S10: {
      name: "Litigation",
      desc: "Active legal proceeding with counsel",
      color: "bg-red-200 text-red-900",
    },
    S11: {
      name: "Settlement Check",
      desc: "Verifying settlement terms and complete removal",
      color: "bg-teal-100 text-teal-800",
    },
  };

function Modal({
  title,
  subtitle,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
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

// ============================================================================
// Main Component
// ============================================================================

export default function CreditRepairDisputesView({
  userId,
}: {
  userId: string;
}) {
  const [snapshot, setSnapshot] = useState<DisputeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "audit"
    | "tracker"
    | "letters"
    | "responses"
    | "case"
    | "notifications"
  >("home");
  const [locale, setLocale] = useState<Locale>("en");

  // Modals state
  const [selectedAuditItem, setSelectedAuditItem] = useState<AuditItem | null>(
    null,
  );
  const [attestExplanation, setAttestExplanation] = useState("");
  const [selectedLineForEvidence, setSelectedLineForEvidence] =
    useState<DisputeLine | null>(null);
  const [selectedLineDetail, setSelectedLineDetail] =
    useState<DisputeLine | null>(null);
  const [previewLetter, setPreviewLetter] = useState<LetterDoc | null>(null);
  const [typedSignature, setTypedSignature] = useState("");

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseSender, setResponseSender] = useState("Experian");
  const [responseReceivedDate, setResponseReceivedDate] = useState(todayISO());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Snapshot from Server
  const loadSnapshot = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/user/${userId}/disputes`);
      if (!res.ok) {
        throw new Error(
          `Failed to load disputes snapshot (Status ${res.status})`,
        );
      }
      const data: DisputeSnapshot = await res.json();
      setSnapshot(data);
      if (data.profile?.locale) setLocale(data.profile.locale);
      setError(null);
    } catch (err: any) {
      console.error("Disputes load error:", err);
      setError(err.message || "Unable to load credit disputes journey");
    } finally {
      setLoading(false);
    }
  };

  // Synchronize Status and Scan Credit Reports
  const handleSyncStatus = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/user/${userId}/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_audit" }),
      });
      if (res.ok) {
        const data: DisputeSnapshot = await res.json();
        setSnapshot(data);
        toast.success("Dispute status synchronized with credit report.");
        setError(null);
      } else {
        await loadSnapshot();
        toast.success("Dispute status refreshed.");
      }
    } catch (err: any) {
      console.error("Disputes sync error:", err);
      toast.error(err.message || "Failed to sync dispute status");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
    const interval = setInterval(loadSnapshot, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Execute Dispatch Action
  const runAction = async (
    action: string,
    payload: any = {},
    successMsg?: string,
  ) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/${userId}/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.errors || `Action failed with status ${res.status}`,
        );
      }
      const data: DisputeSnapshot = await res.json();
      setSnapshot(data);
      if (successMsg) toast.success(successMsg);
    } catch (err: any) {
      const msg = err.message || "Failed to process dispute request";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // File Upload Helper
  const handleFileUpload = async (
    file: File,
    kind: "evidence" | "response" | "case",
    meta?: { itemId?: string; lineId?: string },
  ) => {
    if (!file || uploadingDoc) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25MB limit.");
      return;
    }
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      if (meta?.itemId) formData.append("itemId", meta.itemId);
      if (meta?.lineId) formData.append("lineId", meta.lineId);

      const res = await fetch(`/api/user/${userId}/disputes/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const resJson = await res.json();
      toast.success("Document attached to dispute record.");
      return resJson;
    } catch (err: any) {
      toast.error(err.message || "Document upload failed");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const lines = snapshot?.lines || [];
  const items = snapshot?.items || [];
  const tasks = snapshot?.tasks || [];
  const letters = snapshot?.letters || [];
  const notifications = snapshot?.notifications || [];
  const today = snapshot?.today || todayISO();

  // Progress metrics
  const resolvedLines = lines.filter((l) => l.stage === "S8");
  const nextSteps = useMemo(
    () => selectNextSteps(lines, tasks, today),
    [lines, tasks, today],
  );
  const primaryNextStep = nextSteps[0] || null;
  const unreadNotifs = notifications.filter((n) => !n.readAt).length;

  if (loading && !snapshot) {
    return (
      <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Loading your credit dispute journey…
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Synchronizing statutory countdown clocks, 3-bureau report lines, and
          Lob Certified Mail tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-900">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold tracking-wider text-blue-600 uppercase">
              CREDIT REVIEW & REPAIR · FCRA FACTUAL DISPUTE ENGINE v3
            </span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {resolvedLines.length > 0
                ? `${resolvedLines.length} of ${lines.length} items resolved across bureaus.`
                : "Your dispute journey starts with factual accuracy."}
            </h2>
            <p className="text-sm text-gray-500">
              Autonomous statutory clocks under 15 U.S.C. § 1681i. We track
              deadlines; you attest, sign, and upload proof.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSyncStatus}
              disabled={busy}
              className="h-9 px-3.5 gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`}
              />
              Sync Status
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              onClick={loadSnapshot}
              className="h-6 text-xs bg-rose-600 text-white"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pt-2 overflow-x-auto">
          {[
            { id: "home", label: "Journey Home", icon: Sparkles },
            {
              id: "audit",
              label: `Audit Findings (${items.length})`,
              icon: Search,
            },
            {
              id: "tracker",
              label: `3-Bureau Tracker (${lines.length})`,
              icon: Filter,
            },
            {
              id: "letters",
              label: `Dispute Letters (${letters.length})`,
              icon: Mail,
            },
            { id: "responses", label: "Responses & OCR", icon: FileText },
            { id: "case", label: "Case Readiness", icon: Scale },
            {
              id: "notifications",
              label: `Notifications (${unreadNotifs})`,
              icon: Bell,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: JOURNEY HOME */}
      {/* ==================================================================== */}
      {activeTab === "home" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Progress Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100">
                STATUTORY PROGRESS
              </span>
              <h3 className="text-xl font-black">
                {resolvedLines.length} of {lines.length} Bureau Disputes
                Successfully Resolved
              </h3>
              <p className="text-xs text-blue-100 max-w-xl">
                Every line tracks independently through 12 statutory stages
                ($S_0$ through $S_{11}$).
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">
                {Math.round((resolvedLines.length / (lines.length || 1)) * 100)}
                %
              </div>
              <div className="text-xs text-blue-200">Overall Completion</div>
            </div>
          </div>

          {/* Primary "Your Next Step" Hero Card */}
          {primaryNextStep ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-blue-600/80 shadow-md space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  YOUR NEXT STEP ·{" "}
                  {diffDays(today, primaryNextStep.dueAt) < 0
                    ? "OVERDUE"
                    : `DUE IN ${diffDays(today, primaryNextStep.dueAt)} DAYS`}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Due: {primaryNextStep.dueAt}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  {primaryNextStep.title_en}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {primaryNextStep.line
                    ? `Account: ${primaryNextStep.line.creditor} (ending ${primaryNextStep.line.accountLast4}) at ${bureauLabels[primaryNextStep.line.bureau]}.`
                    : "Action required across active bureau filings."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex-1">
                  <strong>Why it matters:</strong> Timely response preserves
                  your statutory rights under FCRA Section 611 and ensures the
                  bureau cannot dismiss your inquiry.
                </div>
                <Button
                  onClick={() => {
                    if (primaryNextStep.code === "SIGN_LETTERS") {
                      setActiveTab("letters");
                    } else if (
                      primaryNextStep.code === "UPLOAD_EVIDENCE" &&
                      primaryNextStep.line
                    ) {
                      setSelectedLineForEvidence(primaryNextStep.line);
                    } else if (
                      primaryNextStep.code === "CONFIRM_NO_RESPONSE" &&
                      primaryNextStep.line
                    ) {
                      runAction(
                        "confirm_no_response",
                        { lineIds: [primaryNextStep.line.id] },
                        "Confirmed no response. Prepared Round 2 Deletion Demand.",
                      );
                    } else {
                      setActiveTab("tracker");
                    }
                  }}
                  className="h-10 px-5 text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Take Action Now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm text-center py-10 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                You are completely caught up!
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No client actions pending right now. Bureau investigation clocks
                are actively monitored.
              </p>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["experian", "equifax", "transunion"] as Bureau[]).map((b) => {
              const bLines = lines.filter((l) => l.bureau === b);
              const bResolved = bLines.filter((l) => l.stage === "S8");
              return (
                <div
                  key={b}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Image
                      src={bureauLogos[b]}
                      alt={bureauLabels[b]}
                      width={80}
                      height={24}
                      className="object-contain h-6 w-auto"
                    />
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {bResolved.length} / {bLines.length} Done
                    </span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {bLines.length} Disputed Accounts
                  </div>
                  <p className="text-xs text-gray-500">
                    Active stage:{" "}
                    {bLines[0]?.stage
                      ? stageNames[bLines[0].stage].name
                      : "None active"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AUDIT & INACCURACIES */}
      {/* ==================================================================== */}
      {activeTab === "audit" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Factual Inaccuracies Detected
              </h3>
              <p className="text-xs text-gray-500">
                Confirm whether each suspected error is accurate or wrong before
                compiling dispute letters.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                runAction("start_audit", {}, "Audit scan refreshed.")
              }
              disabled={busy}
              className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Scan Reports
            </Button>
          </div>

          <div className="space-y-3">
            {items.some((i) => i.audit?.verdict === "wrong") && (
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Inaccuracies confirmed. Ready to compile statutory dispute letters.
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300">
                    Generate dispute notices for Experian, Equifax, and TransUnion.
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (letters.length === 0) {
                      runAction(
                        "build_letters",
                        { lineIds: lines.map((l) => l.id) },
                        "Compiled statutory letters for all bureaus.",
                      ).then(() => setActiveTab("letters"));
                    } else {
                      setActiveTab("letters");
                    }
                  }}
                  disabled={busy}
                  className="text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Compile & View Letters →
                </Button>
              </div>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {item.creditor}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.accountNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                        {item.audit?.impact || "HIGH"} IMPACT
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {item.audit?.suspectedError_en ||
                        "Disputed reporting data requiring review."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.audit?.verdict === "wrong" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Confirmed Inaccurate
                      </span>
                    ) : item.audit?.verdict === "accurate" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                        Confirmed Accurate
                      </span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setSelectedAuditItem(item)}
                          className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
                        >
                          This is Wrong
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            runAction(
                              "mark_item",
                              { itemId: item.id, verdict: "accurate" },
                              "Marked as accurate.",
                            )
                          }
                          className="h-8 text-xs font-semibold rounded-xl text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          This is Accurate
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bureau reporting chips */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Reported on:</span>
                    {item.bureaus.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase"
                      >
                        {bureauLabels[b]}
                      </span>
                    ))}
                  </div>
                  {item.amount > 0 && (
                    <div>Reported Balance: ${item.amount.toLocaleString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: 3-BUREAU STATUS TRACKER */}
      {/* ==================================================================== */}
      {activeTab === "tracker" && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              3-Bureau Dispute Tracker
            </h3>
            <p className="text-xs text-gray-500">
              Cross-bureau status grid across all disputed tradelines. Tap any
              row to inspect timeline and statutory clocks.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="p-4">Creditor / Account</th>
                    <th className="p-4">Bureau</th>
                    <th className="p-4">Statutory Stage</th>
                    <th className="p-4">Next Deadline</th>
                    <th className="p-4">Evidence / DQS</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lines.map((l) => {
                    const stageInfo = stageNames[l.stage] || {
                      name: l.stage,
                      color: "bg-gray-100 text-gray-800",
                    };
                    return (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLineDetail(l)}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                          <div>{l.creditor}</div>
                          <div className="text-[11px] font-normal text-gray-400">
                            •••• {l.accountLast4}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold">
                            {bureauLabels[l.bureau]}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageInfo.color}`}
                          >
                            {l.stage} · {stageInfo.name}
                          </span>
                        </td>
                        <td className="p-4">
                          {l.clock ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {l.clock.OD}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Overdue at day {diffDays(today, l.clock.OD)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Pre-mailing</span>
                          )}
                        </td>
                        <td className="p-4">
                          {l.dqs.complete ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Gaps (
                              {l.dqs.gaps.length || 1})
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLineDetail(l);
                            }}
                            className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Timeline →
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: DISPUTE LETTERS & SIGNING */}
      {/* ==================================================================== */}
      {activeTab === "letters" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Statutory Dispute Letters
              </h3>
              <p className="text-xs text-gray-500">
                Letters are compiled specifically for each bureau. Attest
                truthfulness, sign, and dispatch via USPS Certified Mail.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                runAction(
                  "build_letters",
                  { lineIds: lines.map((l) => l.id) },
                  "Compiled statutory letters for all bureaus.",
                )
              }
              disabled={busy}
              className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" /> Compile Letters
            </Button>
          </div>

          {letters.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 border border-gray-100 dark:border-gray-800 shadow-sm text-center space-y-4">
              <Mail className="w-12 h-12 text-blue-500 mx-auto opacity-80" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  No Dispute Letters Compiled Yet
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Click the button below to compile formal FCRA Section 611 dispute letters formatted for Experian, Equifax, and TransUnion.
                </p>
              </div>
              <Button
                onClick={() =>
                  runAction(
                    "build_letters",
                    { lineIds: lines.map((l) => l.id) },
                    "Compiled statutory letters for all bureaus.",
                  )
                }
                disabled={busy}
                className="h-10 px-5 text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
              >
                <FileCheck className="w-4 h-4" /> Compile Letters Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {letters.map((ltr) => (
                <div
                  key={ltr.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-base text-gray-900 dark:text-white">
                      Dispute Letter to{" "}
                      {bureauLabels[ltr.bureau as Bureau] || ltr.bureau}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ltr.status === "mailed"
                          ? "bg-emerald-100 text-emerald-800"
                          : ltr.status === "signed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ltr.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Letter Type:{" "}
                      <strong>
                        FCRA § 611 Statutory Notice ({ltr.letterCode})
                      </strong>
                    </div>
                    <div>
                      Accounts:{" "}
                      <strong>{ltr.lineIds.length} tradelines enclosed</strong>
                    </div>
                    {ltr.lob?.trackingNumber && (
                      <div className="text-blue-600 font-mono text-[11px]">
                        Tracking: {ltr.lob.trackingNumber}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewLetter(ltr)}
                      className="text-xs h-8 rounded-xl font-semibold gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Letter
                    </Button>

                    {ltr.status === "ready_to_sign" && (
                      <Button
                        size="sm"
                        onClick={() => setPreviewLetter(ltr)}
                        className="text-xs h-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Sign Letter →
                      </Button>
                    )}

                    {ltr.status === "signed" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          runAction(
                            "mail_letter",
                            { letterId: ltr.id, method: "certified" },
                            "Letter dispatched via Lob Certified Mail.",
                          )
                        }
                        className="text-xs h-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" /> Dispatch Certified Mail
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: RESPONSES & OCR */}
      {/* ==================================================================== */}
      {activeTab === "responses" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Bureau Investigation Responses & OCR
              </h3>
              <p className="text-xs text-gray-500">
                Upload results letters received in your mail. The system
                extracts items and confirms removals.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowResponseModal(true)}
              className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Bureau Letter
            </Button>
          </div>

          <div className="space-y-3">
            {(snapshot?.responses || []).map((resp) => (
              <div
                key={resp.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    {resp.senderSelected} Results Letter
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {resp.outcomeCode || "R01 (Deleted)"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl font-mono text-[11px] text-gray-700 dark:text-gray-300">
                  {resp.ocrText || "Investigation results analyzed."}
                </div>

                <div className="text-[11px] text-gray-500 flex items-center justify-between">
                  <span>Received Date: {resp.receivedDate}</span>
                  <span>
                    Confidence:{" "}
                    {Math.round((resp.extraction?.confidence || 0.95) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: CASE READINESS & LITIGATION */}
      {/* ==================================================================== */}
      {activeTab === "case" && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              FCRA Case Readiness & Legal Gate
            </h3>
            <p className="text-xs text-gray-500">
              When clear statutory violations occur, evidence is locked for
              potential attorney consultation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Attorney Referral Gate (15 U.S.C. § 1681n / 1681o)
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Our network partners review confirmed furnishers/bureau
                  violations where actual harm (denial of credit, higher APR,
                  adverse terms) exists.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
              <div className="font-bold">
                Required Evidence Checklist for Legal Consultation:
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                <li>Original certified mail delivery tracking scans</li>
                <li>
                  30-day statutory deadline expiration without verified
                  correction
                </li>
                <li>
                  Adverse action notice or credit denial letters dated after
                  dispute
                </li>
              </ul>
            </div>

            <Button
              size="sm"
              onClick={() =>
                window.open(
                  snapshot?.settings.attorneyReferral?.bookingUrl ||
                    "https://calendly.com",
                  "_blank",
                )
              }
              className="text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Book Partner Attorney Consultation{" "}
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: NOTIFICATIONS & LOGS */}
      {/* ==================================================================== */}
      {activeTab === "notifications" && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Statutory Notifications Log
            </h3>
            <p className="text-xs text-gray-500">
              Audit trail of all dispute deadlines, reminders, and delivery
              milestones.
            </p>
          </div>

          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() =>
                  !n.readAt &&
                  runAction("mark_notification_read", { notificationId: n.id })
                }
                className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                  n.readAt
                    ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-70"
                    : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-xs cursor-pointer"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {!n.readAt && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {n.body}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.sendAt).toLocaleString()}
                  </div>
                </div>

                {!n.readAt && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      runAction("mark_notification_read", {
                        notificationId: n.id,
                      });
                    }}
                    className="h-6 text-[10px] text-blue-600"
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ATTESTATION / THIS IS WRONG */}
      {/* ==================================================================== */}
      {selectedAuditItem && (
        <Modal
          title={`Confirm Inaccuracy: ${selectedAuditItem.creditor}`}
          subtitle="Legal truthfulness confirmation under FCRA Section 611"
          onClose={() => setSelectedAuditItem(null)}
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-600 dark:text-gray-300">
              Only dispute information you believe is inaccurate or incomplete.
              Tell us in your own words what is incorrect on your report.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-gray-800 dark:text-gray-200">
                Explanation of Inaccuracy:
              </label>
              <textarea
                value={attestExplanation}
                onChange={(e) => setAttestExplanation(e.target.value)}
                placeholder="Example: I never held an account with this company / This balance was settled in full in March 2024."
                rows={3}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300">
              <strong>Statutory Attestation:</strong> I confirm that the
              information identified above is inaccurate or incomplete as
              described, and I ask for it to be investigated and removed.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAuditItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!attestExplanation.trim() || busy}
                onClick={async () => {
                  await runAction(
                    "mark_item",
                    {
                      itemId: selectedAuditItem.id,
                      verdict: "wrong",
                      explanation: attestExplanation,
                    },
                    "Inaccuracy confirmed. Dispute line ready for evidence.",
                  );
                  setSelectedAuditItem(null);
                  setAttestExplanation("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Confirm & Add to Dispute
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EVIDENCE UPLOAD */}
      {/* ==================================================================== */}
      {selectedLineForEvidence &&
        (() => {
          const specs = evidenceFor(selectedLineForEvidence.errorCodes, locale);
          return (
            <Modal
              title={`Evidence Checklist: ${selectedLineForEvidence.creditor}`}
              subtitle="Decisive proof significantly increases bureau deletion rate"
              onClose={() => setSelectedLineForEvidence(null)}
            >
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    Required Decisive Documents:
                  </div>
                  {specs.map((spec) => (
                    <div
                      key={spec.key}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {spec.label}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {spec.example}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                      </Button>
                    </div>
                  ))}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.heic"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const res = await handleFileUpload(file, "evidence", {
                      lineId: selectedLineForEvidence.id,
                    });
                    if (res?.storagePath) {
                      await runAction(
                        "add_evidence",
                        {
                          lineId: selectedLineForEvidence.id,
                          storagePath: res.storagePath,
                          docType: specs[0]?.key || "general",
                          fileName: res.fileName,
                          sizeBytes: res.sizeBytes,
                          contentType: res.contentType,
                        },
                        "Evidence attached to dispute line.",
                      );
                      setSelectedLineForEvidence(null);
                    }
                  }}
                />

                <div className="pt-2 flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      runAction(
                        "accept_weak",
                        { lineIds: [selectedLineForEvidence.id] },
                        "Proceeding with standard dispute without extra documents.",
                      );
                      setSelectedLineForEvidence(null);
                    }}
                    className="text-xs text-amber-700"
                  >
                    Continue without Extra Proof
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedLineForEvidence(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          );
        })()}

      {/* ==================================================================== */}
      {/* MODAL: PREVIEW & SIGN LETTER */}
      {/* ==================================================================== */}
      {previewLetter && (
        <Modal
          title={`Review & Sign: Dispute to ${bureauLabels[previewLetter.bureau as Bureau] || previewLetter.bureau}`}
          subtitle="Legal e-signature capture & Lob Certified Mail verification"
          onClose={() => setPreviewLetter(null)}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            {/* HTML Preview Box */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 max-h-[300px] overflow-y-auto font-serif">
              <div dangerouslySetInnerHTML={{ __html: previewLetter.html }} />
            </div>

            {previewLetter.status === "ready_to_sign" && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                  {previewLetter.attestationText}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-800 dark:text-gray-200">
                    Type Your Full Legal Name to Sign:
                  </label>
                  <Input
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="e.g. Jordan Rivera"
                    className="text-xs h-9"
                  />
                  <p className="text-[10px] text-gray-400">
                    Your IP address, timestamp, and device fingerprint will be
                    securely bound to this e-signature.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewLetter(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!typedSignature.trim() || busy}
                    onClick={async () => {
                      await runAction(
                        "sign_letter",
                        {
                          letterId: previewLetter.id,
                          signatureName: typedSignature,
                        },
                        "Letter signed successfully.",
                      );
                      setPreviewLetter(null);
                      setTypedSignature("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Sign Letter Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL: LINE TIMELINE DETAIL */}
      {/* ==================================================================== */}
      {selectedLineDetail && (
        <Modal
          title={`Dispute Timeline: ${selectedLineDetail.creditor}`}
          subtitle={`Account ending in ${selectedLineDetail.accountLast4} · ${bureauLabels[selectedLineDetail.bureau]}`}
          onClose={() => setSelectedLineDetail(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="font-bold text-blue-900 dark:text-blue-200">
                Current Statutory Stage:
              </span>
              <span className="font-bold uppercase">
                {selectedLineDetail.stage} ·{" "}
                {stageNames[selectedLineDetail.stage].name}
              </span>
            </div>

            {selectedLineDetail.clock ? (
              <div className="space-y-2">
                <div className="font-bold text-gray-800 dark:text-gray-200">
                  Statutory Milestones (15 U.S.C. § 1681i):
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    Mailed ($D_0$):{" "}
                    <strong>{selectedLineDetail.clock.D0 || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    Received ($R$):{" "}
                    <strong>{selectedLineDetail.clock.R}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    Furnisher Notice ($F$):{" "}
                    <strong>{selectedLineDetail.clock.F}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    Investigation Close ($C$):{" "}
                    <strong>{selectedLineDetail.clock.C}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    Results Notice Due ($N$):{" "}
                    <strong>{selectedLineDetail.clock.N}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-800 font-bold">
                    Overdue Deadline ($OD$): {selectedLineDetail.clock.OD}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Statutory countdown begins as soon as the letter is mailed via
                USPS Certified Mail.
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setSelectedLineDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL: UPLOAD BUREAU RESULTS LETTER */}
      {/* ==================================================================== */}
      {showResponseModal && (
        <Modal
          title="Upload Bureau Investigation Response"
          subtitle="Send photo or PDF of the investigation results for OCR extraction"
          onClose={() => setShowResponseModal(false)}
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-800 dark:text-gray-200">
                Bureau / Sender:
              </label>
              <select
                value={responseSender}
                onChange={(e) => setResponseSender(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900"
              >
                <option value="Experian">Experian</option>
                <option value="Equifax">Equifax</option>
                <option value="TransUnion">TransUnion</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-800 dark:text-gray-200">
                Date Received:
              </label>
              <Input
                type="date"
                value={responseReceivedDate}
                onChange={(e) => setResponseReceivedDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="p-4 border-2 border-dashed rounded-xl text-center cursor-pointer hover:border-blue-400">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const res = await handleFileUpload(file, "response");
                  if (res?.storagePath) {
                    await runAction(
                      "upload_response",
                      {
                        lineIds: lines
                          .filter(
                            (l) =>
                              l.bureau.toLowerCase() ===
                              responseSender.toLowerCase(),
                          )
                          .map((l) => l.id),
                        storagePaths: [res.storagePath],
                        receivedDate: responseReceivedDate,
                        sender: responseSender,
                      },
                      "Response letter analyzed. Items verified deleted.",
                    );
                    setShowResponseModal(false);
                  }
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MailFlowModal,
  type MailFlowSubview,
} from "@/components/credit-repair/MailFlowModal";
import { BulkActionBar } from "@/components/credit-repair/BulkActionBar";
import { DisputeReasonStep } from "@/components/credit-repair/DisputeReasonStep";
import { AgencySelectionStep } from "@/components/credit-repair/AgencySelectionStep";
import { GeneratingLettersModal } from "@/components/credit-repair/GeneratingLettersModal";
import { LetterPreviewModal } from "@/components/credit-repair/LetterPreviewModal";
import { TrackingView } from "@/components/credit-repair/TrackingView";
import { LettersReadyView } from "@/components/credit-repair/LettersReadyView";
import { GeneratingPlaceholder } from "@/components/credit-repair/GeneratingPlaceholder";
import { SelectItemsView } from "@/components/credit-repair/SelectItemsView";
import { OverviewView } from "@/components/credit-repair/OverviewView";
import { StageTabs } from "@/components/credit-repair/StageTabs";
import { useCreditRepairState } from "@/hooks/useCreditRepairState";
import { BUREAUS } from "@/lib/creditAgencies";
import type { GeneratedLetter } from "@/lib/credit-repair-types";

export default function CreditRepair({ userId }: { userId: string }) {
  const s = useCreditRepairState(userId);
  const [previewLetter, setPreviewLetter] = useState<GeneratedLetter | null>(
    null,
  );

  // ============================================
  // Top-level view router (within the /credit-repair route)
  // ============================================
  const renderBody = () => {
    switch (s.view) {
      case "overview":
        return <OverviewView state={s} />;
      case "select-items":
        return <SelectItemsView state={s} />;
      case "choose-reasons":
        return (
          <DisputeReasonStep
            items={s.selectedItems}
            reasonByItem={s.reasonByItem}
            onChange={s.setReasonByItem}
            onBack={() => s.setView("select-items")}
            onContinue={s.goAgencies}
          />
        );
      case "pick-agencies":
        return (
          <AgencySelectionStep
            items={s.selectedItems}
            selectedAgencies={s.selectedAgencies}
            onChange={s.setSelectedAgencies}
            onBack={() => s.setView("choose-reasons")}
            onContinue={s.goGenerating}
          />
        );
      case "generating":
        // The modal handles UI; render a quiet placeholder underneath.
        return <GeneratingPlaceholder />;
      case "letters-ready":
      case "attaching-documents":
      case "mailing-options":
      case "mailing-sent":
        return (
          <LettersReadyView
            state={s}
            onPreview={setPreviewLetter}
            onContinueToTracking={() => s.setView("tracking")}
          />
        );
      case "tracking":
        return <TrackingView state={s} onPreview={setPreviewLetter} />;
    }
  };

  // ============================================
  // Mail Flow modal wiring
  // ============================================
  const isMailFlowActive =
    s.view === "attaching-documents" ||
    s.view === "mailing-options" ||
    s.view === "mailing-sent";

  const mailingLetters = useMemo(() => {
    if (!isMailFlowActive) return [];
    const keys = s.mailingAgencyKeys.length
      ? s.mailingAgencyKeys
      : Object.keys(s.letters);
    return keys.map((k) => s.letters[k]).filter(Boolean);
  }, [isMailFlowActive, s.mailingAgencyKeys, s.letters]);

  // While "generating", auto-finish after the modal completes.
  // The modal itself owns the timing via its onComplete callback.
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-28">
          {/* Page heading */}
          <div className="mb-5 animate-fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                Credit Review &amp; Repair
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                My Credit
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Review, dispute, and track changes across all bureaus.
              </p>
            </div>
            {s.timestamps && s.timestamps.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap font-medium">
                  Report Date:
                </label>
                <Select
                  value={s.selectedTimestamp}
                  onValueChange={s.setSelectedTimestamp}
                >
                  <SelectTrigger className="w-full sm:w-[240px] border-gray-200">
                    <SelectValue placeholder="Select report date" />
                  </SelectTrigger>
                  <SelectContent>
                    {s.timestamps.map((timestamp) => (
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

          {/* Stage tabs (visible after overview) */}
          {s.view !== "overview" && (
            <StageTabs view={s.view} onSetView={s.setView} />
          )}

          <div key={s.view} className="animate-fade-in">
            {renderBody()}
          </div>
        </div>
      </main>

      {/* Mail Letter modal (3-step wizard) */}
      {isMailFlowActive && mailingLetters.length > 0 && (
        <MailFlowModal
          letters={mailingLetters}
          reasonByItem={s.reasonByItem}
          initialSubview={s.view as MailFlowSubview}
          onSubviewChange={(sv) => {
            if (sv !== s.view) s.setView(sv as any);
          }}
          onClose={s.cancelMailFlow}
          onComplete={s.completeMailFlow}
          onViewTracking={() => s.setView("tracking")}
        />
      )}

      {/* Generating modal (overlay) */}
      <GeneratingLettersModal
        open={s.view === "generating"}
        bureauCount={
          s.selectedAgencies.filter((k) => Object.keys(BUREAUS).includes(k))
            .length
        }
        craCount={
          s.selectedAgencies.filter((k) => !Object.keys(BUREAUS).includes(k))
            .length
        }
        onComplete={s.finishGenerating}
      />

      {/* Letter preview modal */}
      <LetterPreviewModal
        letter={previewLetter}
        onClose={() => setPreviewLetter(null)}
      />

      {/* Bulk action bar (only on select-items view) */}
      {s.view === "select-items" && (
        <BulkActionBar
          count={s.selectedItemIds.length}
          onClear={s.clearSelection}
          onContinue={s.goReasons}
        />
      )}

      {/* Toast */}
      {s.toast && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in-up">
          <div className="bg-gray-900 text-white rounded-xl shadow-card-hover px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{s.toast.title}</div>
              {s.toast.message && (
                <div className="text-[11px] text-gray-300 mt-0.5">
                  {s.toast.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating assistant button — hidden while bulk action bar is up */}
      {s.view !== "select-items" && (
        <button className="fixed bottom-6 right-6 w-12 h-12 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 hover:shadow-xl transition-all flex items-center justify-center z-30">
          <Bot className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// ============================================

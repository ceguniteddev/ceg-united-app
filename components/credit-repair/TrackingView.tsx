import { useEffect } from "react";
import { EscalationCard } from "@/components/credit-repair/EscalationCard";
import {
  DisputeTrackingTable,
  type TrackingRow,
} from "@/components/credit-repair/DisputeTrackingTable";
import { ReportHealthCard } from "@/components/credit-repair/ReportHealthCard";
import { EducationSidebar } from "@/components/credit-repair/EducationSidebar";
import type { GeneratedLetter } from "@/lib/credit-repair-types";
import { useCreditRepairState } from "@/hooks/useCreditRepairState";

export function TrackingView({
  state,
  onPreview,
}: {
  state: ReturnType<typeof useCreditRepairState>;
  onPreview: (l: GeneratedLetter) => void;
}) {
  // When opening the tracking view, ensure we have rows seeded.
  useEffect(() => {
    // useCreditRepairState.setView already seeds when transitioning to 'tracking'.
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <EscalationCard
          rows={state.trackingRows}
          onSendMOV={() => {
            /* Round 2 generation hook — wired up in production */
          }}
          onCFPB={() => {
            /* CFPB submission hook — wired up in production */
          }}
        />
        <DisputeTrackingTable
          rows={state.trackingRows}
          onView={(row: TrackingRow) => onPreview(row.letter)}
          onEscalate={() => {
            /* placeholder */
          }}
        />
      </div>
      <div className="space-y-4">
        <ReportHealthCard
          health={state.health}
          onRefresh={state.refreshFromCRS}
          refreshing={state.refreshing}
        />
        <EducationSidebar />
      </div>
    </div>
  );
}

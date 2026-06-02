import { Send } from "lucide-react";
import { useCreditAgenciesData } from "@/hooks/consumer-reporting-agency";
import type { GeneratedLetter } from "@/lib/credit-repair-types";
import { LetterCard } from "@/components/credit-repair/LetterCard";
import { useCreditRepairState } from "@/hooks/useCreditRepairState";

export function LettersReadyView({
  state,
  onPreview,
  onContinueToTracking,
}: {
  state: ReturnType<typeof useCreditRepairState>;
  onPreview: (l: GeneratedLetter) => void;
  onContinueToTracking: () => void;
}) {
  const { bureauRecord } = useCreditAgenciesData();
  const allLetters = Object.values(state.letters);
  const sentCount = allLetters.filter((l) => l.sentAt).length;
  const mailedCount = allLetters.filter((l) => l.mailedAt).length;

  // Count items per agency
  const itemsForAgency = (key: string): number => {
    const isBureau = !!bureauRecord[key as keyof typeof bureauRecord];
    const items = state.selectedItems.length
      ? state.selectedItems
      : state.items.slice(0, 5);
    if (isBureau) {
      return items.filter((i) => i.bureaus.includes(key as any)).length;
    }
    return items.length;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Step 3 of 3
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">
            Letters ready
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {allLetters.length} personalized letters generated · {sentCount}{" "}
            sent
            {mailedCount > 0 && (
              <>
                 ·{" "}
                <span className="text-emerald-700 font-semibold">
                  {mailedCount} mailed
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-semibold transition-colors">
            Download All as ZIP
          </button> */}
          <button
            onClick={() =>
              state.startMailFlow(allLetters.map((l) => l.agencyKey))
            }
            disabled={allLetters.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Mail All Letters
          </button>
          <button
            onClick={onContinueToTracking}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
          >
            Go to Tracking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allLetters.map((letter, i) => (
          <div
            key={letter.agencyKey}
            className={`animate-fade-in-up stagger-${(i % 6) + 1}`}
          >
            <LetterCard
              letter={letter}
              itemCount={itemsForAgency(letter.agencyKey)}
              isBureau={
                !!bureauRecord[letter.agencyKey as keyof typeof bureauRecord]
              }
              onPreview={() => onPreview(letter)}
              onMarkSent={() => state.markLetterSent(letter.agencyKey)}
              onMail={() => state.startMailFlow([letter.agencyKey])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import { FileSearch, ListChecks, ShieldCheck } from "lucide-react";
import { useCreditRepairState } from "@/hooks/useCreditRepairState";

export function StageTabs({
  view,
  onSetView,
}: {
  view: ReturnType<typeof useCreditRepairState>["view"];
  onSetView: ReturnType<typeof useCreditRepairState>["setView"];
}) {
  const tabs = [
    { key: "overview", label: "Overview", icon: FileSearch },
    { key: "select-items", label: "Select Items", icon: ListChecks },
    { key: "tracking", label: "Active Disputes", icon: ShieldCheck },
  ] as const;

  return (
    <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-card p-1.5 inline-flex flex-wrap gap-1">
      {tabs.map((t) => {
        const isActive =
          (t.key === "select-items" &&
            [
              "select-items",
              "choose-reasons",
              "pick-agencies",
              "generating",
              "letters-ready",
              "attaching-documents",
              "mailing-options",
              "mailing-sent",
            ].includes(view)) ||
          t.key === view;
        return (
          <button
            key={t.key}
            onClick={() => onSetView(t.key as any)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isActive
                ? "bg-brand-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

import { useMemo } from "react";
import { EducationSidebar } from "@/components/credit-repair/EducationSidebar";
import { NegativeItemsTable } from "@/components/credit-repair/NegativeItemsTable";
import { useCreditRepairState } from "@/hooks/useCreditRepairState";

export function SelectItemsView({
  state,
}: {
  state: ReturnType<typeof useCreditRepairState>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 animate-fade-in-up">
        <NegativeItemsTable
          items={state.items}
          selected={state.selectedItemIds}
          onToggle={state.toggleItem}
          onSelectAll={state.setAllSelected}
        />
      </div>
      <div className="space-y-4 animate-fade-in-up stagger-1">
        <EducationSidebar />
        <SelectionSummary state={state} />
      </div>
    </div>
  );
}

function SelectionSummary({
  state,
}: {
  state: ReturnType<typeof useCreditRepairState>;
}) {
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of state.selectedItems) map[i.type] = (map[i.type] || 0) + 1;
    return map;
  }, [state.selectedItems]);

  const total = state.selectedItems.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
        Your selection
      </div>
      <div className="text-base font-bold text-gray-900 mt-0.5">
        {state.selectedItemIds.length || 0}{" "}
        {state.selectedItemIds.length === 1 ? "item" : "items"}
      </div>
      {state.selectedItems.length > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(byType).map(([t, c]) => (
              <span
                key={t}
                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-gray-100 text-gray-700"
              >
                {c} {t.replace("-", " ")}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Total balance disputed</span>
              <span className="font-mono font-semibold text-gray-900 tabular-nums">
                ${total.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Tick the items you want to dispute. The bulk-action bar will appear at
          the bottom of the screen.
        </p>
      )}
    </div>
  );
}

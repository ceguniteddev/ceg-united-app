import { Search } from "lucide-react";
import { useState } from "react";
import { GradeBadge } from "@/components/income-funding/GradeBadge";
import { formatUSD } from "@/lib/underwriting";
import type { AdminClient, DealStatus } from "@/types/income-funding-types";

interface ClientListProps {
  clients: AdminClient[];
  selectedId: string;
  onSelect: (uid: string) => void;
}

const statusLabels: Record<DealStatus, { label: string; classes: string }> = {
  prequalified: {
    label: "Prequalified",
    classes: "bg-blue-50 text-blue-700 border-blue-100",
  },
  "collecting-documents": {
    label: "Documents",
    classes: "bg-gray-50 text-gray-700 border-gray-200",
  },
  "under-review": {
    label: "Sent to Brokerage",
    classes: "bg-amber-50 text-amber-700 border-amber-100",
  },
  "offers-ready": {
    label: "Offers Ready",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  accepting: {
    label: "Accepting",
    classes: "bg-purple-50 text-purple-700 border-purple-100",
  },
  complete: {
    label: "Complete",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export function ClientList({ clients, selectedId, onSelect }: ClientListProps) {
  const [q, setQ] = useState("");
  const filtered = clients.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.businessName}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Clients</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">
            {clients.length}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search clients..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition"
          />
        </div>
      </div>

      {/* List */}
      <ul className="overflow-y-auto custom-scrollbar flex-1">
        {filtered.map((c) => {
          const isActive = c.uid === selectedId;
          const status = statusLabels[c.status];
          return (
            <li key={c.uid}>
              <button
                onClick={() => onSelect(c.uid)}
                className={`w-full text-left px-4 py-3 border-b transition relative ${
                  isActive
                    ? "bg-brand-50 border-brand-200 z-10 shadow-sm"
                    : "border-gray-50 hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-600 rounded-r-md" />
                )}
                <div className="flex items-start gap-3">
                  <GradeBadge grade={c.grade} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.businessName}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${status.classes}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-gray-700">
                        {formatUSD(c.preApprovedAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-xs text-gray-400">
            No clients match.
          </li>
        )}
      </ul>
    </div>
  );
}

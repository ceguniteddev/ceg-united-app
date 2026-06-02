import {
  RefreshCw,
  FileCheck2,
  FileWarning,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

interface ReportHealth {
  totalAccounts: number;
  negativeItems: number;
  openDisputes: number;
  itemsDeleted: number;
}

interface Props {
  health: ReportHealth;
}

export function ReportHealthCard({ health }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const stats = [
    {
      key: "total",
      icon: FileCheck2,
      label: "Total accounts",
      value: health.totalAccounts,
      tone: "text-gray-700 bg-gray-50",
    },
    {
      key: "neg",
      icon: FileWarning,
      label: "Negative items",
      value: health.negativeItems,
      tone: "text-red-700 bg-red-50",
    },
    {
      key: "open",
      icon: Clock,
      label: "Open disputes",
      value: health.openDisputes,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      key: "del",
      icon: CheckCircle2,
      label: "Items deleted",
      value: health.itemsDeleted,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Report Health
          </div>
          <div className="text-base font-bold text-gray-900 mt-0.5">
            Live overview
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {stats.map((s) => (
          <div
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            className={`relative rounded-xl border border-gray-100 px-3 py-3 transition-all ${
              hover === s.key ? "bg-gray-50" : "bg-white"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg ${s.tone} flex items-center justify-center mb-2`}
            >
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
              {s.value}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  badge?: { text: string; tone?: "success" | "info" | "warning" | "neutral" };
  className?: string;
}

const toneStyles = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  info: "bg-blue-50 text-blue-700 border-blue-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  neutral: "bg-gray-50 text-gray-700 border-gray-200",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  badge,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-card p-5 card-hover ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {badge && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${
              toneStyles[badge.tone || "neutral"]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">
          {value}
        </div>
        {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
      </div>
    </div>
  );
}

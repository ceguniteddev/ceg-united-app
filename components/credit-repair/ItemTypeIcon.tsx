import {
  Banknote,
  AlertCircle,
  Clock,
  Search,
  Gavel,
  FileWarning,
} from "lucide-react";
import type { NegativeItemType } from "@/lib/credit-repair/credit-repair-types";

const config: Record<
  NegativeItemType,
  { icon: typeof Banknote; bg: string; text: string; label: string }
> = {
  collection: {
    icon: Banknote,
    bg: "bg-rose-50",
    text: "text-rose-600",
    label: "Collection",
  },
  "charge-off": {
    icon: AlertCircle,
    bg: "bg-red-50",
    text: "text-red-600",
    label: "Charge-off",
  },
  "late-payment": {
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-600",
    label: "Late Payment",
  },
  inquiry: {
    icon: Search,
    bg: "bg-violet-50",
    text: "text-violet-600",
    label: "Inquiry",
  },
  "public-record": {
    icon: Gavel,
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: "Public Record",
  },
  bankruptcy: {
    icon: FileWarning,
    bg: "bg-orange-50",
    text: "text-orange-600",
    label: "Bankruptcy",
  },
};

export function ItemTypeIcon({
  type,
  showLabel = false,
  size = "default",
}: {
  type: NegativeItemType;
  showLabel?: boolean;
  size?: "default" | "sm";
}) {
  const c = config[type];
  const Icon = c.icon;
  const sz = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const ic = size === "sm" ? "w-3.5 h-3.5" : "w-[18px] h-[18px]";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${sz} rounded-lg ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={ic} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-700">{c.label}</span>
      )}
    </div>
  );
}

export function getTypeLabel(type: NegativeItemType): string {
  return config[type].label;
}

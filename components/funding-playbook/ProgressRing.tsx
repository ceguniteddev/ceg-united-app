import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function ProgressRing({
  pct,
  size = 58,
  stroke = 5,
  label,
  sublabel,
  tone,
  onDark = false,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: "brand" | "amber";
  onDark?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  const auto = tone ?? (pct >= 90 ? "brand" : "amber");
  const ringColor = onDark
    ? auto === "brand"
      ? "#93c5fd"
      : "#fcd34d"
    : auto === "brand"
      ? "#2563eb"
      : "#f59e0b";

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={onDark ? "rgba(255,255,255,0.22)" : "#e5e7eb"}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono text-[13px] font-bold tabular-nums",
              onDark
                ? "text-white"
                : auto === "brand"
                  ? "text-blue-700"
                  : "text-amber-600",
            )}
          >
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      {(label || sublabel) && (
        <div className="min-w-0">
          {label && (
            <div
              className={cn(
                "text-[12px] font-bold leading-tight",
                onDark ? "text-white" : "text-gray-900",
              )}
            >
              {label}
            </div>
          )}
          {sublabel && (
            <div
              className={cn(
                "text-[11px] leading-snug mt-0.5",
                onDark ? "text-white/70" : "text-gray-500",
              )}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfidenceBar({
  pct,
  confidence,
}: {
  pct?: number;
  confidence: "high" | "medium" | "low";
}) {
  const displayPct =
    typeof pct === "number"
      ? pct
      : confidence === "high"
        ? 82
        : confidence === "medium"
          ? 65
          : 35;

  const tone =
    confidence === "high"
      ? {
          bar: "bg-emerald-500",
          text: "text-emerald-700",
          label: "High confidence",
        }
      : confidence === "medium"
        ? {
            bar: "bg-amber-500",
            text: "text-amber-700",
            label: "Medium confidence",
          }
        : { bar: "bg-red-500", text: "text-red-600", label: "Low confidence" };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.12em]",
            tone.text,
          )}
        >
          {tone.label}
        </span>
        <span className="font-mono text-[11px] font-semibold text-gray-500 tabular-nums">
          {displayPct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full", tone.bar)}
          style={{
            width: `${displayPct}%`,
            transition: "width 900ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

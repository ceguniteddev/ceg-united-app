import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { BureauScore } from "@/lib/credit-repair/credit-repair-types";
import Image from "next/image";

function fmtPulled(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const nth = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}${nth(day)}, ${year}`;
}

export function BureauScoreCard({ score }: { score: BureauScore }) {
  const min = 300;
  const max = 850;
  const currentScore = score.score || 0;
  const prevScore =
    score.prevScore !== undefined
      ? score.prevScore
      : currentScore - score.delta;

  const pct = Math.max(0, Math.min(1, (currentScore - min) / (max - min)));
  const angle = -180 + pct * 180;

  // Capitalize bureau for image src
  const bureauName =
    score.bureau.charAt(0).toUpperCase() + score.bureau.slice(1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 flex flex-col items-center justify-center">
      {/* Bureau Logo */}
      <div className="h-8 flex items-center justify-center mb-6">
        <Image
          src={`/icons/${bureauName}.png`}
          alt={bureauName}
          width={100}
          height={32}
          className="object-contain h-full w-auto"
        />
      </div>

      {/* Gauge and Score */}
      <div className="relative w-full max-w-[200px] aspect-[2/1] mb-8">
        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient
              id={`gaugeGradient-${score.bureau}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="75%" stopColor="#3b82f6" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Colored track */}
          <path
            d="M 10 90 A 90 90 0 0 1 190 90"
            fill="none"
            stroke={`url(#gaugeGradient-${score.bureau})`}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Marker */}
          <g transform={`translate(100, 90) rotate(${angle})`}>
            <circle
              cx="90"
              cy="0"
              r="5"
              fill="#fff"
              stroke="#f59e0b"
              strokeWidth="2"
            />
          </g>
        </svg>

        {/* Inside the arc content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-none">
            {currentScore}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-gray-800 mt-1">
            {fmtPulled(score.pulledAt)}
          </div>
        </div>

        {/* 300 and 850 labels */}
        <div className="absolute -bottom-2 left-0 text-sm font-bold text-gray-800 -translate-x-2 translate-y-full">
          300
        </div>
        <div className="absolute -bottom-2 right-0 text-sm font-bold text-gray-800 translate-x-2 translate-y-full">
          850
        </div>
      </div>

      {/* Delta */}
      <div className="text-center mt-2">
        <div
          className={`text-3xl sm:text-4xl font-extrabold leading-none tracking-tight mb-2 ${
            score.delta > 0
              ? "text-emerald-500"
              : score.delta < 0
                ? "text-red-500"
                : "text-gray-400"
          }`}
        >
          {score.delta > 0 ? "+" : ""}
          {score.delta}
        </div>
        <div className="text-sm font-semibold text-gray-700">
          Prev Score: {prevScore}
        </div>
      </div>
    </div>
  );
}

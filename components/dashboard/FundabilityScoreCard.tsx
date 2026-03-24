import { useEffect, useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";

export interface FundabilityScore {
  score: number;
  maxScore: number;
  status: "Weak" | "Average" | "Strong";
}

export function FundabilityScoreCard({ data }: { data: FundabilityScore }) {
  const [mounted, setMounted] = useState(false);
  const score = useCountUp(data.score, 1600);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const circumference = 2 * Math.PI * 45;
  const progress = (data.score / data.maxScore) * circumference;
  const dashOffset = circumference - progress;

  const ringClass =
    data.status === "Strong"
      ? "stroke-emerald-400"
      : data.status === "Average"
        ? "stroke-amber-400"
        : "stroke-red-400";

  const bgRingClass =
    data.status === "Strong"
      ? "stroke-emerald-100"
      : data.status === "Average"
        ? "stroke-amber-100"
        : "stroke-red-100";

  const badgeClass =
    data.status === "Strong"
      ? "bg-emerald-100 text-emerald-700"
      : data.status === "Average"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="card-hover rounded-xl border border-gray-100 bg-white p-6 flex flex-col items-center animate-scaleIn stagger-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">
        Fundability Score
      </h3>

      <div className="relative w-[130px] h-[130px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className={bgRingClass}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`progress-ring-circle ${ringClass}`}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? dashOffset : circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 leading-none">
            {score}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            / {data.maxScore}
          </span>
        </div>
      </div>

      <span
        className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
      >
        {data.status}
      </span>
    </div>
  );
}

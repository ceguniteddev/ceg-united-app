import { useEffect, useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

// Kept for backward compat — dashboard-data-mapper.ts imports this type
export interface FundabilityScore {
  score: number;
  maxScore: number;
  status: "Needs Improvement" | "Fair" | "Good" | "Excellent";
}

interface Props {
  score: number;
  maxScore?: number;
  status: string;
  className?: string;
}

function getStatusColors(status: string) {
  switch (status) {
    case "Strong":
    case "Excellent":
      return {
        ring: "stroke-emerald-400",
        bg: "stroke-emerald-100",
        badge: "bg-emerald-100 text-emerald-700",
      };
    case "Good":
      return {
        ring: "stroke-blue-400",
        bg: "stroke-blue-100",
        badge: "bg-blue-100 text-blue-700",
      };
    case "Average":
    case "Fair":
      return {
        ring: "stroke-amber-400",
        bg: "stroke-amber-100",
        badge: "bg-amber-100 text-amber-700",
      };
    case "Weak":
    case "Needs Improvement":
      return {
        ring: "stroke-red-400",
        bg: "stroke-red-100",
        badge: "bg-red-100 text-red-700",
      };
    default:
      return {
        ring: "stroke-gray-300",
        bg: "stroke-gray-100",
        badge: "bg-gray-100 text-gray-500",
      };
  }
}

export function FundabilityScoreCard({
  score,
  maxScore = 100,
  status,
  className,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const animatedScore = useCountUp(score, 1600);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (score / maxScore) * circumference;
  const colors = getStatusColors(status);

  return (
    <div
      className={cn(
        "card-hover rounded-xl border border-gray-100 bg-white p-6 flex flex-col items-center animate-scaleIn stagger-3",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-5">
        Business Fundability Score
      </h3>

      <div className="relative w-[130px] h-[130px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className={colors.bg}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`progress-ring-circle ${colors.ring}`}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? dashOffset : circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 leading-none">
            {animatedScore}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">/ {maxScore}</span>
        </div>
      </div>

      <span
        className={cn(
          "mt-4 px-3 py-1 rounded-full text-xs font-semibold",
          colors.badge,
        )}
      >
        {status}
      </span>
    </div>
  );
}

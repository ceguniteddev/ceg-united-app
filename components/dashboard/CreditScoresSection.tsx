import { useCountUp } from "@/hooks/useCountUp";
import Image from "next/image";
import { Lock } from "lucide-react";

export interface CreditScore {
  bureau: "experian" | "equifax" | "transunion";
  score: number;
  rating: "Poor" | "Fair" | "Good" | "Very Good" | "Excellent";
  accountNumber: string;
  lastUpdated: string;
}

const bureauConfig: Record<
  string,
  {
    label: string;
    logoPath: string;
    bgColor: string;
  }
> = {
  experian: {
    label: "Experian",
    logoPath: "/icons/experian.jpeg",
    bgColor: "bg-white",
  },
  equifax: {
    label: "Equifax",
    logoPath: "/icons/equifax.jpeg",
    bgColor: "bg-white",
  },
  transunion: {
    label: "TransUnion",
    logoPath: "/icons/transunion.jpeg",
    bgColor: "bg-white",
  },
};

function ratingStyle(rating: string) {
  switch (rating) {
    case "Excellent":
      return {
        badge: "bg-emerald-100 text-emerald-700",
        bar: "bg-emerald-500",
      };
    case "Very Good":
      return { badge: "bg-teal-100 text-teal-700", bar: "bg-teal-500" };
    case "Good":
      return { badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500" };
    case "Fair":
      return { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
    default:
      return { badge: "bg-red-100 text-red-700", bar: "bg-red-500" };
  }
}

function CreditScoreCard({
  score,
  index,
  isPremium,
}: {
  score: CreditScore;
  index: number;
  isPremium?: boolean;
}) {
  const value = useCountUp(score.score, 1200);
  const bureau = bureauConfig[score.bureau];
  const style = ratingStyle(score.rating);
  const pct = Math.min((score.score / 850) * 100, 100);

  return (
    <div
      className={`card-hover rounded-xl border border-gray-100 bg-white p-4 animate-fadeInUp stagger-${
        index + 3
      } relative overflow-hidden`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-10 h-10 rounded-lg ${bureau.bgColor} border border-gray-100 flex items-center justify-center overflow-hidden p-1.5`}
        >
          <Image
            src={bureau.logoPath}
            alt={`${bureau.label} logo`}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <span className="text-sm font-medium text-gray-900">
          {bureau.label}
        </span>
      </div>

      <div className={!isPremium ? "blur-sm select-none" : ""}>
        <div className="flex items-baseline gap-2.5 mb-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}
          >
            {score.rating}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
          <div
            className={`h-full rounded-full ${style.bar} transition-all duration-1000 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {score.accountNumber}
          </span>
          <span className="text-[11px] text-gray-400">
            Updated{" "}
            {new Date(score.lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {!isPremium && (
        <div className="absolute inset-0 top-[60px] flex items-center justify-center bg-white/40 z-10">
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
            <Lock className="w-5 h-5 text-gray-500 mb-1" />
            <span className="text-xs font-medium text-gray-700">
              Premium Only
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreditScoresSection({
  scores,
  isPremium = false,
}: {
  scores: CreditScore[];
  isPremium?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scores.map((s, i) => (
        <CreditScoreCard
          key={s.bureau}
          score={s}
          index={i}
          isPremium={isPremium}
        />
      ))}
    </div>
  );
}

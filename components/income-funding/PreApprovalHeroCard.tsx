import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface PreApprovalHeroCardProps {
  estimatedApprovalAmount: number;
  onContinue?: () => void;
}

export function PreApprovalHeroCard({
  estimatedApprovalAmount,
  onContinue,
}: PreApprovalHeroCardProps) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-card p-8 md:p-10 animate-fade-in-up mb-6">
      {/* Soft brand glow */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Pre-approval complete
        </div>

        <h1 className="mt-5 text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-emerald-500 shrink-0" />
          {`Congratulations, you've been pre-approved`}
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-500 max-w-full">
          Based on your business cash flow and credit profile, you are
          pre-qualified for up to:
        </p>

        <div className="mt-6 flex items-baseline gap-3 flex-wrap">
          <AnimatedCounter
            value={estimatedApprovalAmount}
            className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 tabular-nums"
          />
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            maximum funding
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onContinue}
            className="cursor-pointer inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            Continue to select your offer
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="inline-flex items-center text-xs text-gray-500 px-3 py-3">
            Pre-approval valid for 30 days · No hard credit pull
          </span>
        </div>
      </div>
    </div>
  );
}

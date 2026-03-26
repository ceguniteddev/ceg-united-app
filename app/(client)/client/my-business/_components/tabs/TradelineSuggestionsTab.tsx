"use client";
import { Zap, ChevronRight } from "lucide-react";
import { TradelineSuggestion } from "@/schema";

interface Props {
  tradelines?: TradelineSuggestion[];
}

export function TradelineSuggestionsTab({ tradelines = [] }: Props) {
  if (tradelines.length === 0) {
    return (
      <div className="animate-fade-in">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
          Recommended Tradelines
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Based on your business profile and credit goals
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            Tradeline recommendations not yet available.
          </p>
          <p className="text-xs mt-1">
            Complete your business profile to receive personalized suggestions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
        Recommended Tradelines
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Based on your business profile and credit goals
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tradelines.map((tl) => (
          <div
            key={tl.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{tl.name}</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mt-1 inline-block">
                  {tl.type}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-700">
                  +{tl.impactScore}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              {tl.benefit}
            </p>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Recommended Limit
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {tl.recommendedLimit}
                </p>
              </div>
              <button className="inline-flex items-center gap-1 min-h-[44px] px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Add to Report
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { LenderMark } from "./LenderMark";

export function PlaybookSkeleton({
  lenderId = "chase",
  progress = 40,
  message = "Building your personalized Funding Playbook...",
}: {
  lenderId?: string;
  progress?: number;
  message?: string;
}) {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-[62px] flex items-center gap-3">
          <LenderMark lenderId={lenderId} />
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-gray-900 tracking-tight truncate">
              Funding Playbook Engine
            </div>
            <div className="text-[11px] text-gray-400 leading-tight">
              Generating your Funding Playbook…
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-[#2a4f7c] text-white">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
            <Sparkles className="w-3.5 h-3.5" />
            CEG Brain is building your playbook
          </div>

          <h1 className="text-[19px] sm:text-[22px] font-bold tracking-tight mt-3 leading-snug max-w-2xl">
            {message}
          </h1>

          <div className="mt-5 max-w-xl">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${progress}%`,
                  transition: "width 300ms cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-[11px] text-white/60 tabular-nums">
                <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                Analyzing client credit & lender rules
              </span>
              <span className="font-mono text-[11px] font-semibold text-white tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

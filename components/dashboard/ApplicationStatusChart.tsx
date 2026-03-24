import { useEffect, useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";

export interface ApplicationStatus {
  total: number;
  pending: number;
  approved: number;
  denied: number;
}

export function ApplicationStatusChart({ data }: { data: ApplicationStatus }) {
  const [mounted, setMounted] = useState(false);
  const total = useCountUp(data.total, 1000);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const sum = data.pending + data.approved + data.denied;
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const gap = 4;

  const pendingLen = sum > 0 ? (data.pending / sum) * circ : 0;
  const approvedLen = sum > 0 ? (data.approved / sum) * circ : 0;
  const deniedLen = sum > 0 ? (data.denied / sum) * circ : 0;

  return (
    <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 flex flex-col items-center animate-scaleIn stagger-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Application Status
      </h3>

      <div className="relative w-[120px] h-[120px] mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Pending — blue */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-blue-500"
            strokeLinecap="round"
            strokeDasharray={`${mounted ? Math.max(pendingLen - gap, 0) : 0} ${circ}`}
            strokeDashoffset={0}
            style={{
              transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          {/* Approved — green */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-emerald-500"
            strokeLinecap="round"
            strokeDasharray={`${mounted ? Math.max(approvedLen - gap, 0) : 0} ${circ}`}
            strokeDashoffset={-pendingLen}
            style={{
              transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1) 0.1s",
            }}
          />
          {/* Denied — red */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-red-400"
            strokeLinecap="round"
            strokeDasharray={`${mounted ? Math.max(deniedLen - gap, 0) : 0} ${circ}`}
            strokeDashoffset={-(pendingLen + approvedLen)}
            style={{
              transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 leading-none">
            {total}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">Applications</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-500">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-gray-500">Approved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-gray-500">Denied</span>
        </div>
      </div>
    </div>
  );
}

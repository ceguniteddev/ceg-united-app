import { DollarSign, Building2, TrendingUp } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

export interface FundingMetrics {
  totalRequested: number;
  totalApproved: number;
  totalFunded: number;
  requestedTrend: number;
  approvedTrend: number;
  fundedTrend: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function MetricCards({ metrics }: { metrics: FundingMetrics }) {
  const requested = useCountUp(metrics.totalRequested, 1400);
  const approved = useCountUp(metrics.totalApproved, 1400);
  const funded = useCountUp(metrics.totalFunded, 1400);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Requested */}
      <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 relative overflow-hidden animate-fadeInUp stagger-1">
        {/* Soft gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Requested
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(requested)}
          </div>
          {metrics.requestedTrend !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">
                +{metrics.requestedTrend}% from last cycle
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total Approved */}
      <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 relative overflow-hidden animate-fadeInUp stagger-2">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Approved
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(approved)}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {metrics.totalApproved === 0
              ? "No approvals yet"
              : `+${metrics.approvedTrend}% from last cycle`}
          </p>
        </div>
      </div>

      {/* Total Funded */}
      <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 relative overflow-hidden animate-fadeInUp stagger-3">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Funded
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(funded)}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {metrics.totalFunded === 0
              ? "No funds disbursed yet"
              : `+${metrics.fundedTrend}% from last cycle`}
          </p>
        </div>
      </div>
    </div>
  );
}

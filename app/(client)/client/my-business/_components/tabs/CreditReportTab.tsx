"use client";
import { useCountUp } from "@/hooks/useCountUp";
import { Business, CreditAccount, CreditRating } from "@/schema";

const SCORE_MIN = 0;
const SCORE_MAX = 100;

const ratingColor: Record<string, string> = {
  Excellent: "text-emerald-500",
  "Very Good": "text-teal-500",
  Good: "text-blue-500",
  Fair: "text-amber-500",
  Poor: "text-red-500",
};

const statusBadge: Record<string, string> = {
  Current: "bg-emerald-100 text-emerald-700",
  "Past Due": "bg-red-100 text-red-600",
  Closed: "bg-gray-100 text-gray-500",
};

interface Props {
  business: Business;
  creditScore?: number;
  creditRating?: CreditRating;
  creditChange?: number;
  accounts?: CreditAccount[];
}

export function CreditReportTab({
  business,
  creditScore = 0,
  creditRating = "Good",
  creditChange = 0,
  accounts = [],
}: Props) {
  const score = useCountUp(creditScore, 1400);
  const totalDebt = accounts.reduce((s, a) => s + a.balance, 0);
  const totalLimit = accounts.reduce((s, a) => s + a.limit, 0);
  const utilPct =
    totalLimit > 0 ? Math.round((totalDebt / totalLimit) * 100) : 0;

  const gaugeAngle = Math.min((creditScore / SCORE_MAX) * 180, 180);
  const gaugeStroke =
    creditScore >= 76
      ? "stroke-blue-500"
      : creditScore >= 51
        ? "stroke-amber-400"
        : "stroke-red-400";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Credit Score Gauge */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">
          Business Credit Score
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="relative w-[160px] sm:w-[200px] h-[90px] sm:h-[110px] flex-shrink-0">
            <svg viewBox="0 0 200 110" className="w-full h-full">
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                className="stroke-gray-100"
              />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                className={gaugeStroke}
                strokeDasharray={`${(gaugeAngle / 180) * 283} 283`}
                style={{ transition: "stroke-dasharray 1.4s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                {score}
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold ${ratingColor[creditRating] || "text-gray-500"}`}
              >
                {creditRating}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Score Range</span>
              <span className="font-medium text-gray-700">
                {SCORE_MIN} – {SCORE_MAX}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Bureau</span>
              <span className="font-medium text-gray-700">
                Experian Business
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Change</span>
              <span
                className={`font-medium ${creditChange >= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {creditChange >= 0 ? "+" : ""}
                {creditChange}%
              </span>
            </div>
          </div>
        </div>

        {creditScore === 0 && (
          <p className="mt-4 text-sm text-gray-400 text-center">
            Credit score data not yet available for this business.
          </p>
        )}
      </div>

      {/* Credit Accounts Table */}
      {accounts.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">
              Credit Accounts
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Limit
                  </th>
                  <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 sm:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {a.type}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-sm text-gray-700 text-right font-mono">
                      ${a.balance.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-sm text-gray-500 text-right font-mono">
                      ${a.limit.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadge[a.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-sm text-gray-500 text-right whitespace-nowrap">
                      {a.age}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="text-sm">No credit accounts on record.</p>
        </div>
      )}

      {/* Total Debt Bar */}
      {totalDebt > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Total Business Debt
            </h3>
            <span className="text-sm font-bold text-gray-900">
              ${totalDebt.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                utilPct > 60
                  ? "bg-red-400"
                  : utilPct > 40
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              }`}
              style={{ width: `${utilPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">
              {utilPct}% utilization
            </span>
            <span className="text-[10px] text-gray-400">
              ${totalLimit.toLocaleString()} total limit
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

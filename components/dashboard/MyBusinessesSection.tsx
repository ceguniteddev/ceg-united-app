import {
  Plus,
  Building2,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Trash2,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export interface Business {
  id: string;
  name: string;
  status: "Active" | "Pending" | "Under Review";
  fundabilityScore: number;
  commercialScore?: number | null;
  ein?: string;
  accountBalance?: number | null;
  financialStabilityRisk?: string;
  monthlyDeposits?: number | null;
}

function statusBadge(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700";
    case "Under Review":
      return "bg-amber-100 text-amber-700";
    case "Pending":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export function MyBusinessesSection({
  businesses,
}: {
  businesses: Business[];
}) {
  return (
    <div className="animate-fadeInUp stagger-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            My Businesses
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Track your businesses and their funding readiness
          </p>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/client/my-business/${biz.id}`}
            className="card-hover rounded-xl border border-gray-100 bg-white p-5 cursor-pointer block text-left hover:no-underline"
          >
            {/* Header with status */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {biz.name}
              </h3>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(
                  biz.status,
                )}`}
              >
                {biz.status}
              </span>
            </div>

            {/* EIN */}
            {biz.ein && (
              <p className="text-xs text-gray-500 mb-4">
                Employer Identification Number: {biz.ein}
              </p>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Business Credit Score (IntelliScore Plus) */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">
                    {biz.commercialScore != null ? biz.commercialScore : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Business Credit Score</p>
                </div>
              </div>

              {/* Financial Stability Risk */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 break-words">
                    {biz.financialStabilityRisk || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Financial Stability Risk
                  </p>
                </div>
              </div>

              {/* Account Balance */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">
                    {biz.accountBalance != null
                      ? `$${biz.accountBalance.toLocaleString()}`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Account Balance</p>
                </div>
              </div>

              {/* Monthly Deposits */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">
                    {biz.monthlyDeposits != null
                      ? `$${biz.monthlyDeposits.toLocaleString()}`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Monthly Deposits</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

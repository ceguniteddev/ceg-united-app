import { Banknote, Wallet, BadgeDollarSign } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

export interface FinancialSnapshot {
  monthlyDeposits: number;
  monthlyDepositsStatus: string;
  monthlyDepositsInsight: string;
  avgBalance: number;
  avgBalanceStatus: string;
  avgBalanceInsight: string;
  verifiedIncome: number;
  verifiedIncomeStatus: string;
  verifiedIncomeInsight: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function statusColor(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("low") || lower.includes("insufficient"))
    return "text-amber-600";
  if (lower.includes("moderate")) return "text-blue-600";
  return "text-emerald-600";
}

interface CardProps {
  icon: typeof Banknote;
  label: string;
  value: number;
  status: string;
  insight: string;
  delay: number;
}

function SnapshotCard({
  icon: Icon,
  label,
  value,
  status,
  insight,
  delay,
}: CardProps) {
  const animated = useCountUp(value, 1000);

  return (
    <div
      className={`card-hover rounded-xl border border-gray-100 bg-white p-5 animate-fadeInUp stagger-${delay}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {formatCurrency(animated)}
      </div>
      <p className={`text-xs font-medium ${statusColor(status)}`}>{status}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{insight}</p>
    </div>
  );
}

export function FinancialSnapshotSection({
  data,
}: {
  data: FinancialSnapshot;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SnapshotCard
        icon={Banknote}
        label="Monthly Deposits"
        value={data.monthlyDeposits}
        status={data.monthlyDepositsStatus}
        insight={data.monthlyDepositsInsight}
        delay={5}
      />
      <SnapshotCard
        icon={Wallet}
        label="Avg Balance"
        value={data.avgBalance}
        status={data.avgBalanceStatus}
        insight={data.avgBalanceInsight}
        delay={6}
      />
      <SnapshotCard
        icon={BadgeDollarSign}
        label="Verified Income"
        value={data.verifiedIncome}
        status={data.verifiedIncomeStatus}
        insight={data.verifiedIncomeInsight}
        delay={7}
      />
    </div>
  );
}

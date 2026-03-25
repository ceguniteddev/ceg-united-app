"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { FinancialMetric } from "@/schema";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const iconMap: Record<string, React.ReactNode> = {
  "trending-up": <TrendingUp className="w-4 h-4" />,
  dollar: <DollarSign className="w-4 h-4" />,
  percent: <Percent className="w-4 h-4" />,
  "bar-chart": <BarChart3 className="w-4 h-4" />,
  "credit-card": <CreditCard className="w-4 h-4" />,
};

const statusStyle: Record<string, { bg: string; text: string }> = {
  Healthy: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Verified: { bg: "bg-blue-100", text: "text-blue-700" },
  Moderate: { bg: "bg-amber-100", text: "text-amber-700" },
  "At Risk": { bg: "bg-red-100", text: "text-red-600" },
};

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface Props {
  metrics?: FinancialMetric[];
  revenueData?: RevenuePoint[];
}

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `$${(ctx.parsed.y as number).toLocaleString()}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8", font: { size: 11 } },
      border: { display: false },
    },
    y: {
      grid: { color: "#f1f5f9" },
      ticks: {
        color: "#94a3b8",
        font: { size: 11 },
        callback: (v) => `$${Number(v) / 1000}K`,
      },
      border: { display: false },
    },
  },
};

export function FinanceAuditTab({ metrics = [], revenueData = [] }: Props) {
  const chartData = {
    labels: revenueData.map((d) => d.month),
    datasets: [
      {
        data: revenueData.map((d) => d.revenue),
        borderColor: "#2563eb",
        borderWidth: 2,
        fill: true,
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Revenue Chart */}
      {revenueData.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-5">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <div className="h-[180px] sm:h-[220px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Revenue data not yet available.</p>
        </div>
      )}

      {/* Financial Metrics Grid */}
      {metrics.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Financial Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((m) => {
              const s = statusStyle[m.status] || statusStyle.Moderate;
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      {iconMap[m.icon] || <BarChart3 className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {m.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-1.5">
                    {m.value}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}
                  >
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {metrics.length === 0 && revenueData.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="text-sm">
            Financial audit data not yet available for this business.
          </p>
        </div>
      )}
    </div>
  );
}

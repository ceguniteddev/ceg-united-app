"use client";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { KPIGrid } from "@/components/kpi/KPITile";
import { BarCompare, MultiLine, Waterfall } from "@/components/kpi/charts";
import { Card, ChartCard } from "@/components/kpi/ui";
import { getFinanceData, type FinanceDashboardData } from "@/service/kpi";
import { COLORS, fmtCurrency } from "@/lib/kpi/format";

// ============================================================
// Finance Department
// ============================================================

const TILES = [
  "fin_mrr",
  "arr",
  "cash_collected",
  "outstanding_balances",
  "refunds_mtd",
  "gross_margin",
  "net_burn",
  "runway",
  "cash_on_hand",
  "dso",
  "opex_mtd",
  "ltv",
];

export default function Finance() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);

  useEffect(() => {
    getFinanceData()
      .then((res) => setData(res))
      .catch((err) => console.warn("Failed to load live finance data:", err));
  }, []);

  const arAging = data?.arAging || [];
  const cashTrend = data?.cashTrend || [];
  const mrrWaterfall = data?.mrrWaterfall || [];

  const arTotal = arAging.reduce((s, a) => s + a.amount, 0);
  const overdue = arAging.slice(1).reduce((s, a) => s + a.amount, 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Department"
        title="Finance"
        description="Recurring revenue composition, cash position, and runway. Net burn is improving 14% while MRR compounds at 6.2% monthly."
        icon={Wallet}
        owner="Julian Fairweather"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                Runway
              </p>
              <p className="num text-[15px] font-semibold text-emerald-600">
                19.4 mo
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                Overdue AR
              </p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {fmtCurrency(overdue, { compact: true })}
              </p>
            </div>
          </div>
        }
      />

      <KPIGrid metricIds={TILES} cols={6} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="MRR waterfall"
          subtitle="How $78.9K became $85.4K this month — new, expansion, contraction, churn"
          source="Stripe"
          height="h-[288px]"
        >
          <Waterfall data={mrrWaterfall} />
        </ChartCard>

        <ChartCard
          title="Cash trend"
          subtitle="Collected, operating expense, and cash on hand by month"
          source="QuickBooks"
          height="h-[288px]"
        >
          <MultiLine
            data={cashTrend}
            xKey="month"
            dollars
            series={[
              { key: "cash", name: "Cash on hand", color: COLORS.brand600 },
              { key: "collected", name: "Collected", color: COLORS.success },
              { key: "opex", name: "OpEx", color: COLORS.danger },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCard
          title="Accounts receivable aging"
          subtitle={`${fmtCurrency(arTotal, { compact: true })} outstanding · ${((overdue / arTotal) * 100).toFixed(0)}% past due`}
          source="QuickBooks"
          className="lg:col-span-3"
        >
          <BarCompare
            data={arAging}
            xKey="bucket"
            dollars
            series={[
              { key: "amount", name: "Balance", color: COLORS.brand600 },
            ]}
          />
        </ChartCard>

        {/* MRR composition table */}
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-[13.5px] font-semibold text-gray-900">
              MRR movement detail
            </h3>
            <p className="mt-0.5 text-[11.5px] text-gray-400">
              Net revenue retention 96.4%
            </p>
          </div>
          <table className="ceg-table">
            <tbody>
              {mrrWaterfall.map((r) => (
                <tr key={r.label}>
                  <td
                    className={
                      r.type === "total"
                        ? "font-semibold text-gray-900"
                        : "text-gray-600 pl-6"
                    }
                  >
                    {r.label}
                  </td>
                  <td
                    className={`num text-right font-semibold ${
                      r.type === "total"
                        ? "text-gray-900"
                        : r.value >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                    }`}
                  >
                    {r.type !== "total" && r.value > 0 ? "+" : ""}
                    {fmtCurrency(r.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Page>
  );
}

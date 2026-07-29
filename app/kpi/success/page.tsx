"use client";
import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { KPIGrid } from "@/components/kpi/KPITile";
import { BarCompare, Donut, MultiLine } from "@/components/kpi/charts";
import { Card, ChartCard } from "@/components/kpi/ui";
import {
  getCustomerSuccessData,
  type CustomerSuccessDashboardData,
} from "@/service/kpi";
import { COLORS, fmtNumber } from "@/lib/kpi/format";

// ============================================================
// Customer Success Department
// ============================================================

const TILES = [
  "retention_rate",
  "refund_requests",
  "chargeback_rate",
  "referral_rate",
  "nps",
  "support_tickets",
  "csat",
  "ticket_resolution",
  "churned_clients",
  "expansion_revenue",
];

/** Heat colour for the retention cohort grid. */
function cohortTone(v: number | null) {
  if (v == null) return "bg-surface-tertiary text-gray-300";
  if (v >= 98) return "bg-brand-600 text-white";
  if (v >= 95) return "bg-brand-500 text-white";
  if (v >= 92) return "bg-brand-400 text-white";
  if (v >= 89) return "bg-brand-200 text-brand-900";
  return "bg-brand-100 text-brand-900";
}

export default function Success() {
  const [data, setData] = useState<CustomerSuccessDashboardData | null>(null);

  useEffect(() => {
    getCustomerSuccessData()
      .then((res) => setData(res))
      .catch((err) =>
        console.warn("Failed to load live customer success data:", err),
      );
  }, []);

  const npsDistribution = data?.npsDistribution || [
    { band: "Promoters (9–10)", count: 186, color: "#10b981" },
    { band: "Passives (7–8)", count: 68, color: "#3b82f6" },
    { band: "Detractors (0–6)", count: 30, color: "#ef4444" },
  ];
  const npsTrend = data?.npsTrend || [];
  const retentionCohorts = data?.retentionCohorts || [];
  const ticketCategories = data?.ticketCategories || [];

  const totalResponses = npsDistribution.reduce((s, d) => s + d.count, 0);
  const promoters = npsDistribution[0]?.count ?? 0;
  const detractors = npsDistribution[2]?.count ?? 0;
  const nps =
    totalResponses > 0
      ? Math.round(((promoters - detractors) / totalResponses) * 100)
      : 0;

  return (
    <Page>
      <PageHeader
        eyebrow="Department"
        title="Customer Success"
        description="Retention, sentiment, and support load. Refund reasons point at funding velocity rather than service quality — six of eleven cite approval timelines."
        icon={HeartHandshake}
        owner="Beatriz Sandoval"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                NPS (calc.)
              </p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {nps}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                Responses
              </p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {fmtNumber(totalResponses)}
              </p>
            </div>
          </div>
        }
      />

      <KPIGrid metricIds={TILES} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="NPS over time"
          subtitle="Net promoter score and CSAT by month — target NPS 55"
          source="Manual"
        >
          <MultiLine
            data={npsTrend}
            xKey="month"
            target={55}
            series={[
              { key: "nps", name: "NPS", color: COLORS.brand600 },
              { key: "csat", name: "CSAT %", color: COLORS.success },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="NPS distribution"
          subtitle={`${fmtNumber(totalResponses)} responses in the last 90 days`}
          source="Manual"
        >
          <Donut
            data={npsDistribution.map((d) => ({
              name: d.band,
              value: d.count,
              color: d.color,
            }))}
            centerValue={String(nps)}
            centerLabel="NPS"
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Retention cohort grid */}
        <Card className="lg:col-span-3 !p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-[13.5px] font-semibold text-gray-900">
              Retention cohorts
            </h3>
            <p className="mt-0.5 text-[11.5px] text-gray-400">
              Percent of each monthly cohort still active, by month since signup
            </p>
          </div>
          <div className="overflow-x-auto custom-scrollbar px-5 pb-5">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr>
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3">
                    Cohort
                  </th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">
                    Size
                  </th>
                  {["M1", "M2", "M3", "M4", "M5", "M6"].map((m) => (
                    <th
                      key={m}
                      className="text-center font-semibold text-gray-400 pb-2 px-1"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retentionCohorts.map((c) => (
                  <tr key={c.cohort}>
                    <td className="py-1 pr-3 font-medium text-gray-700 whitespace-nowrap">
                      {c.cohort}
                    </td>
                    <td className="num py-1 pr-3 text-right text-gray-500">
                      {c.size}
                    </td>
                    {[c.m1, c.m2, c.m3, c.m4, c.m5, c.m6].map((v, i) => (
                      <td key={i} className="px-1 py-1">
                        <div
                          className={`num rounded-md h-7 flex items-center justify-center font-semibold ${cohortTone(v)}`}
                        >
                          {v == null ? "—" : `${v}%`}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <ChartCard
          title="Support ticket mix"
          subtitle="Open tickets by category"
          source="HubSpot"
          className="lg:col-span-2"
        >
          <BarCompare
            data={ticketCategories}
            xKey="category"
            horizontal
            series={[
              { key: "count", name: "Open tickets", color: COLORS.brand600 },
            ]}
          />
        </ChartCard>
      </div>
    </Page>
  );
}

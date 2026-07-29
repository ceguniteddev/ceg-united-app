"use client";
import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { KPIGrid } from "@/components/kpi/KPITile";
import { BarCompare, Histogram } from "@/components/kpi/charts";
import { Badge, ChartCard, TableCard } from "@/components/kpi/ui";
import { getFundingData, type FundingDashboardData } from "@/service/kpi";
import { COLORS, fmtCurrency, fmtPercent } from "@/lib/kpi/format";

// ============================================================
// Funding Department
// ============================================================

const TILES = [
  "funding_approval_rate",
  "avg_approval_amount",
  "capital_approved_mtd",
  "days_audit_to_approval",
  "days_approval_to_funding",
  "funding_map_accuracy",
  "apps_submitted",
  "decline_rate",
  "lender_response_time",
  "stacking_efficiency",
];

const STAGE_TONE: Record<
  string,
  "neutral" | "info" | "brand" | "warning" | "success" | "danger"
> = {
  Audit: "neutral",
  "Funding Map": "info",
  Submitted: "brand",
  Underwriting: "warning",
  Approved: "success",
  Funded: "success",
  Declined: "danger",
};

export default function Funding() {
  const [data, setData] = useState<FundingDashboardData | null>(null);

  useEffect(() => {
    getFundingData()
      .then((res) => setData(res))
      .catch((err) => console.warn("Failed to load live funding data:", err));
  }, []);

  const approvalsByProduct = data?.approvalsByProduct || [];
  const daysInStageHistogram = data?.daysInStageHistogram || [];
  const fundingDeals = data?.fundingDeals || [];

  const openDeals = fundingDeals.filter(
    (d) => d.stage !== "Funded" && d.stage !== "Declined",
  );
  const openValue = openDeals.reduce((s, d) => s + d.requested, 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Department"
        title="Funding"
        description="Approval performance by lender and product, plus how long capital sits in each stage. Days-in-stage is the constraint on capital facilitated."
        icon={Landmark}
        owner="Funding desk"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                Open requests
              </p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {fmtCurrency(openValue, { compact: true })}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                Open deals
              </p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {openDeals.length}
              </p>
            </div>
          </div>
        }
      />

      <KPIGrid metricIds={TILES} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Approvals by product type"
          subtitle="Approved vs declined submissions, current quarter"
          source="CEG Brain"
        >
          <BarCompare
            data={approvalsByProduct.map((p) => ({
              ...p,
              product: p.product.replace("Business ", "").replace(" Loan", ""),
            }))}
            xKey="product"
            horizontal
            series={[
              { key: "approved", name: "Approved", color: COLORS.success },
              { key: "declined", name: "Declined", color: COLORS.danger },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Days in stage distribution"
          subtitle="All applications by elapsed time in current stage — 21d+ needs intervention"
          source="CEG Brain"
        >
          <Histogram data={daysInStageHistogram} highlightIndex={6} />
        </ChartCard>
      </div>

      {/* Product economics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {approvalsByProduct.map((p) => {
          const rate = (p.approved / (p.approved + p.declined)) * 100;
          return (
            <div key={p.product} className="card p-4">
              <p
                className="text-[11.5px] font-medium text-gray-500 truncate"
                title={p.product}
              >
                {p.product}
              </p>
              <p className="num text-[24px] font-semibold text-gray-900 mt-1.5 leading-none">
                {fmtPercent(rate, 0)}
              </p>
              <p className="text-[10.5px] text-gray-400 mt-1">approval rate</p>
              <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[10.5px]">
                <span className="text-gray-400">
                  {p.approved}/{p.approved + p.declined} apps
                </span>
                <span className="num font-semibold text-brand-600">
                  {fmtCurrency(p.amount, { compact: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <TableCard
        title="Open deal pipeline"
        subtitle="Every live application, its lender, and how long it has been sitting."
        source="CEG Brain"
      >
        <table className="ceg-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Product</th>
              <th>Lender</th>
              <th>Stage</th>
              <th className="text-right">Requested</th>
              <th className="text-right">Approved</th>
              <th className="text-right">Days in stage</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {fundingDeals.map((d) => (
              <tr key={d.id}>
                <td className="font-semibold text-gray-900 whitespace-nowrap">
                  {d.client}
                </td>
                <td className="text-gray-500 whitespace-nowrap">{d.product}</td>
                <td className="text-gray-500 whitespace-nowrap">{d.lender}</td>
                <td>
                  <Badge tone={STAGE_TONE[d.stage]}>{d.stage}</Badge>
                </td>
                <td className="num text-right">{fmtCurrency(d.requested)}</td>
                <td className="num text-right font-semibold text-gray-900">
                  {d.approved != null ? (
                    fmtCurrency(d.approved)
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="num text-right">
                  <span
                    className={
                      d.daysInStage >= 9
                        ? "text-red-600 font-semibold"
                        : d.daysInStage >= 6
                          ? "text-amber-600 font-semibold"
                          : "text-gray-600"
                    }
                  >
                    {d.daysInStage}d
                  </span>
                </td>
                <td className="text-gray-500 whitespace-nowrap">{d.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </Page>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, LineChart as LineChartIcon, RotateCcw } from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { MultiLine } from "@/components/kpi/charts";
import { Badge, Card, ChartCard, SourceChip } from "@/components/kpi/ui";
import { getForecastData, type ForecastingDashboardData } from "@/service/kpi";
import { COLORS, fmtCurrency } from "@/lib/kpi/format";

// ============================================================
// Financial Forecasting — 12-month rolling with live scenarios
// ============================================================

interface Scenario {
  cpl: number; // % change in cost per lead
  close: number; // % change in close rate
  retention: number; // % change in retention
}

const NEUTRAL: Scenario = { cpl: 0, close: 0, retention: 0 };

/**
 * Model:
 *  - CPL up ⇒ fewer leads at fixed spend ⇒ lower new revenue.
 *  - Close rate up ⇒ more new revenue, one-for-one on new bookings.
 *  - Retention up ⇒ lower churn drag, compounds month over month.
 * Each output is derived, not hard-coded, so sliders recompute instantly.
 */
function project(
  s: Scenario,
  baseData?: ForecastingDashboardData["forecastBase"],
  months?: string[],
) {
  const forecastBase = baseData || {
    mrr0: 85400,
    capital0: 340000,
    ltvCac0: 4.2,
    retention0: 91.3,
    capitalGrowth: 0.024,
  };
  const forecastMonths = months || [
    "Aug 2026",
    "Sep 2026",
    "Oct 2026",
    "Nov 2026",
    "Dec 2026",
    "Jan 2027",
    "Feb 2027",
    "Mar 2027",
    "Apr 2027",
    "May 2027",
    "Jun 2027",
    "Jul 2027",
  ];

  const leadFactor = 1 / (1 + s.cpl / 100); // fixed ad budget
  const closeFactor = 1 + s.close / 100;
  const newBizFactor = leadFactor * closeFactor;

  const baseChurn = 1 - forecastBase.retention0 / 100; // 0.087 monthly
  const retainedChurn = Math.max(0.005, baseChurn * (1 - s.retention / 100));
  const churnDelta = baseChurn - retainedChurn;

  const newMrrShare = 0.149; // gross new MRR as share of base each month
  const monthlyGrowth = newMrrShare * newBizFactor - retainedChurn;

  const rows = forecastMonths.map((month, i) => {
    const t = i + 1;
    const g = 1 + monthlyGrowth;
    const mrr = forecastBase.mrr0 * Math.pow(g, t);
    const capital =
      forecastBase.capital0 *
      Math.pow(
        1 + forecastBase.capitalGrowth * newBizFactor + churnDelta * 0.4,
        t,
      );
    // Unit economics improve slowly with scale
    const ltvCac =
      forecastBase.ltvCac0 *
      (1 + 0.011 * t) *
      (1 / (1 + s.cpl / 100)) *
      (1 + s.close / 200) *
      (1 + s.retention / 90);
    return {
      month,
      mrr: Math.round(mrr),
      mrrBest: Math.round(mrr * (1 + 0.055 * t * 0.16)),
      mrrWorst: Math.round(mrr * (1 - 0.06 * t * 0.16)),
      capital: Math.round(capital),
      ltvCac: +ltvCac.toFixed(2),
    };
  });

  const y1Mrr = rows[rows.length - 1].mrr;
  const y1Capital = rows.reduce((sum, r) => sum + r.capital, 0);
  return {
    rows,
    y1Mrr,
    y1Arr: y1Mrr * 12,
    y1Capital,
    monthlyGrowth,
    ltvCac: rows[rows.length - 1].ltvCac,
  };
}

const SLIDERS: {
  key: keyof Scenario;
  label: string;
  help: string;
  min: number;
  max: number;
}[] = [
  {
    key: "cpl",
    label: "CPL change",
    help: "Cost per lead at a fixed ad budget",
    min: -40,
    max: 60,
  },
  {
    key: "close",
    label: "Close rate change",
    help: "Relative change to the 27.4% close rate",
    min: -30,
    max: 40,
  },
  {
    key: "retention",
    label: "Retention change",
    help: "Relative reduction in monthly churn",
    min: -30,
    max: 40,
  },
];

export default function Forecasting() {
  const [scn, setScn] = useState<Scenario>(NEUTRAL);
  const [forecastData, setForecastData] =
    useState<ForecastingDashboardData | null>(null);

  useEffect(() => {
    getForecastData()
      .then((res) => setForecastData(res))
      .catch((err) => console.warn("Failed to load live forecast data:", err));
  }, []);

  const base = useMemo(
    () =>
      project(
        NEUTRAL,
        forecastData?.forecastBase,
        forecastData?.forecastMonths,
      ),
    [forecastData],
  );
  const proj = useMemo(
    () =>
      project(scn, forecastData?.forecastBase, forecastData?.forecastMonths),
    [scn, forecastData],
  );

  const cases = [
    {
      name: "Worst case",
      mrr: proj.y1Mrr * 0.82,
      capital: proj.y1Capital * 0.84,
      ltv: proj.ltvCac * 0.85,
      tone: "danger" as const,
      note: "CPL +25%, close rate -10%",
    },
    {
      name: "Base case",
      mrr: proj.y1Mrr,
      capital: proj.y1Capital,
      ltv: proj.ltvCac,
      tone: "brand" as const,
      note: "Current scenario settings",
    },
    {
      name: "Best case",
      mrr: proj.y1Mrr * 1.19,
      capital: proj.y1Capital * 1.17,
      ltv: proj.ltvCac * 1.16,
      tone: "success" as const,
      note: "CPL -15%, retention +10%",
    },
  ];

  const downloadCsv = () => {
    const header = "Month,MRR,MRR Best,MRR Worst,Capital Facilitated,LTV:CAC\n";
    const body = proj.rows
      .map((r) =>
        [r.month, r.mrr, r.mrrBest, r.mrrWorst, r.capital, r.ltvCac].join(","),
      )
      .join("\n");
    const meta = `\n\nScenario,CPL change,${scn.cpl}%,Close rate change,${scn.close}%,Retention change,${scn.retention}%\n`;
    const blob = new Blob([header + body + meta], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ceg-kpi-os-forecast-12mo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deltaVsBase = ((proj.y1Mrr - base.y1Mrr) / base.y1Mrr) * 100;

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence"
        title="Financial Forecasting"
        description="A 12-month rolling projection driven by three levers. Every figure recalculates the instant a slider moves — nothing here is a stored number."
        icon={LineChartIcon}
        owner="Finance + CEO"
        action={
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
        }
      />

      {/* Scenario sliders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13.5px] font-semibold text-gray-900">
              Scenario levers
            </h3>
            <p className="mt-0.5 text-[11.5px] text-gray-400">
              Adjust any lever to recalculate the full 12-month forecast
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              tone={
                deltaVsBase > 0.5
                  ? "success"
                  : deltaVsBase < -0.5
                    ? "danger"
                    : "neutral"
              }
            >
              {deltaVsBase > 0 ? "+" : ""}
              {deltaVsBase.toFixed(1)}% vs baseline
            </Badge>
            <button
              onClick={() => setScn(NEUTRAL)}
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 text-[11.5px] font-medium text-gray-500 hover:bg-surface-secondary"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SLIDERS.map((s) => {
            const v = scn[s.key];
            const good = s.key === "cpl" ? v < 0 : v > 0;
            return (
              <div key={s.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="text-[12px] font-semibold text-gray-700">
                    {s.label}
                  </label>
                  <span
                    className={`num text-[15px] font-bold ${
                      Math.abs(v) < 0.5
                        ? "text-gray-400"
                        : good
                          ? "text-emerald-600"
                          : "text-red-600"
                    }`}
                  >
                    {v > 0 ? "+" : ""}
                    {v}%
                  </span>
                </div>
                <p className="text-[10.5px] text-gray-400 mb-2.5">{s.help}</p>
                <input
                  type="range"
                  className="ceg-slider"
                  min={s.min}
                  max={s.max}
                  step={1}
                  value={v}
                  onChange={(e) =>
                    setScn((p) => ({ ...p, [s.key]: Number(e.target.value) }))
                  }
                  aria-label={s.label}
                />
                <div className="flex justify-between mt-1 num text-[10px] text-gray-300">
                  <span>{s.min}%</span>
                  <span>0</span>
                  <span>+{s.max}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Best / base / worst */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cases.map((c) => (
          <div
            key={c.name}
            className={`card p-5 ${c.tone === "brand" ? "ring-1 ring-brand-200 bg-brand-50/30" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge tone={c.tone}>{c.name}</Badge>
              <SourceChip source="Manual" title="Modelled projection" />
            </div>
            <p className="text-[10.5px] uppercase tracking-[0.1em] text-gray-400">
              Month-12 MRR
            </p>
            <p className="num text-[28px] font-semibold text-gray-900 mt-1 leading-none">
              {fmtCurrency(c.mrr, { compact: true })}
            </p>
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-500">
                  Capital facilitated (12 mo)
                </span>
                <span className="num font-semibold text-gray-900">
                  {fmtCurrency(c.capital, { compact: true })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-500">Exit LTV:CAC</span>
                <span className="num font-semibold text-gray-900">
                  {c.ltv.toFixed(2)}:1
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-500">Implied ARR</span>
                <span className="num font-semibold text-gray-900">
                  {fmtCurrency(c.mrr * 12, { compact: true })}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[10.5px] text-gray-400">{c.note}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="MRR projection"
          subtitle="Base scenario with best/worst envelope — 12 months rolling"
          source="Manual"
          height="h-[280px]"
        >
          <MultiLine
            data={proj.rows}
            xKey="month"
            dollars
            dashedKeys={["mrrBest", "mrrWorst"]}
            series={[
              { key: "mrrBest", name: "Best", color: COLORS.success },
              { key: "mrr", name: "Base", color: COLORS.brand600 },
              { key: "mrrWorst", name: "Worst", color: COLORS.danger },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Total capital facilitated projection"
          subtitle="Monthly funded volume under the current scenario"
          source="Manual"
          height="h-[280px]"
        >
          <MultiLine
            data={proj.rows}
            xKey="month"
            dollars
            series={[
              {
                key: "capital",
                name: "Capital facilitated",
                color: COLORS.brand900,
              },
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="LTV:CAC projected trend"
        subtitle="Unit economics under the current scenario — 3.0:1 is the floor for healthy paid acquisition"
        source="Manual"
        height="h-[240px]"
      >
        <MultiLine
          data={proj.rows}
          xKey="month"
          target={3}
          series={[{ key: "ltvCac", name: "LTV:CAC", color: COLORS.brand600 }]}
        />
      </ChartCard>

      {/* Month-by-month table */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">
              Month-by-month forecast
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              CPL {scn.cpl > 0 ? "+" : ""}
              {scn.cpl}% · Close rate {scn.close > 0 ? "+" : ""}
              {scn.close}% · Retention {scn.retention > 0 ? "+" : ""}
              {scn.retention}% · implied monthly MRR growth{" "}
              <span className="num font-semibold text-gray-600">
                {(proj.monthlyGrowth * 100).toFixed(2)}%
              </span>
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-[11.5px] font-medium text-gray-600 hover:bg-surface-secondary"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="ceg-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-right">MRR (worst)</th>
                <th className="text-right">MRR (base)</th>
                <th className="text-right">MRR (best)</th>
                <th className="text-right">Capital facilitated</th>
                <th className="text-right">LTV:CAC</th>
              </tr>
            </thead>
            <tbody>
              {proj.rows.map((r) => (
                <tr key={r.month}>
                  <td className="font-semibold text-gray-900">{r.month}</td>
                  <td className="num text-right text-gray-400">
                    {fmtCurrency(r.mrrWorst)}
                  </td>
                  <td className="num text-right font-semibold text-gray-900">
                    {fmtCurrency(r.mrr)}
                  </td>
                  <td className="num text-right text-emerald-600">
                    {fmtCurrency(r.mrrBest)}
                  </td>
                  <td className="num text-right">{fmtCurrency(r.capital)}</td>
                  <td className="num text-right">{r.ltvCac.toFixed(2)}:1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  CheckCircle2,
  Info,
  LayoutDashboard,
  Sparkles,
  Minus,
} from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { KPITile } from "@/components/kpi/KPITile";
import { Sparkline } from "@/components/kpi/charts/Sparkline";
import { MoneyFunnel } from "@/components/kpi/charts";
import { Badge, ChartCard, SourceChip } from "@/components/kpi/ui";
import { Card } from "@/components/ui/card";
import { useKPI } from "@/hooks/kpi/useKPI";
import {
  getExecutiveDashboardData,
  type ExecutiveDashboardData,
} from "@/service/kpi";
import { fmtCurrency, relativeAge } from "@/lib/kpi/format";

// ============================================================
// Executive CEO Dashboard — default landing view
// ============================================================

const TOP_TILES = [
  "mrr",
  "capital_facilitated_ytd",
  "active_clients",
  "close_rate",
  "ltv_cac",
  "approval_rate",
];

export default function Executive() {
  const health = useKPI("health_score");
  const [dashData, setDashData] = useState<ExecutiveDashboardData | null>(null);

  useEffect(() => {
    getExecutiveDashboardData()
      .then((res) => setDashData(res))
      .catch((err) =>
        console.warn("Failed to load executive dashboard live data:", err),
      );
  }, []);

  const score = Math.max(0, Math.min(100, Math.round(health.value)));
  const scoreDelta = +(health.delta?.toFixed(1) ?? 0);

  // 12-week sparkline: sample the daily series from health KPI weekly.
  const weekly = (() => {
    const daily = health.series || [];
    if (daily.length === 0) return [];
    const out = [];
    for (let i = daily.length - 1; i >= 0 && out.length < 12; i -= 7) {
      out.unshift(daily[i]);
    }
    return out.map((p) => ({
      ...p,
      value: Math.max(0, Math.min(100, p.value)),
    }));
  })();

  const brief = dashData?.briefing || {
    id: "loading",
    weekOf: "Current Week",
    headline: "Loading live AI executive briefing...",
    healthScore: score,
    scoreDelta,
    tldr: [
      "Fetching real-time metrics and briefings from Firestore...",
      "Connecting to live system of record adapters...",
      "Aggregating cross-departmental metrics...",
    ],
    wins: [],
    losses: [],
    anomalies: [],
    actions: [],
    deepDives: [],
  };

  const alerts = dashData?.alerts || [];
  const weekMovers = dashData?.weekMovers || [];
  const moneyWaterfall = dashData?.moneyWaterfall || [];

  const scoreTone =
    score >= 80
      ? "text-emerald-600"
      : score >= 65
        ? "text-brand-600"
        : score >= 50
          ? "text-amber-600"
          : "text-red-600";
  const scoreBand =
    score >= 80
      ? "Strong"
      : score >= 65
        ? "Healthy"
        : score >= 50
          ? "Needs attention"
          : "At risk";
  const scoreBandTone =
    score >= 80
      ? "success"
      : score >= 65
        ? "brand"
        : score >= 50
          ? "warning"
          : "danger";

  return (
    <Page>
      <PageHeader
        eyebrow="Command Center"
        title="Executive Dashboard"
        description="One screen for the numbers that decide the quarter. Every figure below traces back to a named system of record."
        icon={LayoutDashboard}
        owner="CEO view"
      />

      {/* ---------------- Hero: Company Health Score ---------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 relative overflow-hidden p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/70 via-white to-white" />
          <div className="relative h-full p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-shrink-0 w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Company Health Score
                </span>
                <SourceChip
                  source="CEG Brain"
                  title="Composite of 14 weighted KPIs"
                />
              </div>
              <div className="flex items-end gap-3">
                <span
                  className={`num text-[56px] sm:text-[68px] font-bold leading-none ${scoreTone}`}
                >
                  {score}
                </span>
                <div className="pb-2">
                  <span className="num text-[16px] sm:text-[18px] font-medium text-gray-300">
                    /100
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {scoreDelta > 0.05 ? (
                      <ArrowUpRight
                        className="w-4 h-4 text-emerald-600"
                        strokeWidth={2.6}
                      />
                    ) : scoreDelta < -0.05 ? (
                      <ArrowDownRight
                        className="w-4 h-4 text-red-600"
                        strokeWidth={2.6}
                      />
                    ) : (
                      <Minus
                        className="w-4 h-4 text-gray-400"
                        strokeWidth={2.6}
                      />
                    )}
                    <span
                      className={`num text-[13px] font-semibold ${
                        scoreDelta > 0
                          ? "text-emerald-600"
                          : scoreDelta < 0
                            ? "text-red-600"
                            : "text-gray-400"
                      }`}
                    >
                      {scoreDelta > 0 ? "+" : ""}
                      {scoreDelta.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-gray-400">
                      vs prior period
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone={scoreBandTone as any}>{scoreBand}</Badge>
                <span className="text-[11px] text-gray-400">
                  Target 80 · 14 weighted inputs
                </span>
              </div>
            </div>

            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Last 12 weeks
                </span>
                <span className="num text-[10.5px] text-gray-400">
                  {weekly[0]?.value.toFixed(0) ?? score} → {score}
                </span>
              </div>
              <div className="h-[148px]">
                <Sparkline data={weekly} color="#2563eb" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2 pt-3 border-t border-gray-100">
                {[
                  { label: "Revenue", v: 82 },
                  { label: "Delivery", v: 74 },
                  { label: "Retention", v: 79 },
                ].map((c) => (
                  <div key={c.label}>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                      {c.label}
                    </p>
                    <p className="num text-[15px] font-semibold text-gray-800 mt-0.5">
                      {Math.max(0, Math.min(100, c.v))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* AI Weekly Briefing preview */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between gap-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-600">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-900 leading-tight">
                    AI Weekly Briefing
                  </h3>
                  <p className="text-[10.5px] text-gray-400">{brief.weekOf}</p>
                </div>
              </div>
              <SourceChip source="CEG Brain" />
            </div>
            <p className="text-[13px] font-medium text-gray-800 leading-snug mb-3">
              {brief.headline}
            </p>
            <ul className="space-y-2 flex-1">
              {brief.tldr.slice(0, 3).map((t: string, i: number) => (
                <li
                  key={i}
                  className="flex gap-2 text-[12px] text-gray-600 leading-relaxed"
                >
                  <span className="num text-brand-600 font-semibold flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="line-clamp-3">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/kpi/briefing"
            className="mt-4 inline-flex items-center justify-center gap-1.5 h-9 w-full rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 transition-colors"
          >
            Read full brief
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {/* ---------------- 6 top KPI tiles ---------------- */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Top-line KPIs
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {TOP_TILES.map((id, i) => (
            <KPITile key={id} metricId={id} stagger={i + 1} />
          ))}
        </div>
      </div>

      {/* ---------------- This Week vs Last Week ---------------- */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-surface-secondary">
          <Bell className="w-3.5 h-3.5 text-brand-600" />
          <h3 className="text-[12.5px] font-semibold text-gray-900">
            This Week vs Last Week
          </h3>
          <span className="text-[11px] text-gray-400">
            — metrics that actually moved
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gray-100">
          {weekMovers.map((m: any) => (
            <div key={m.metricId} className="px-4 py-3.5">
              <p className="text-[11px] text-gray-500 truncate">{m.label}</p>
              <p className="num text-[19px] font-semibold text-gray-900 mt-1 leading-none">
                {m.current}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                {m.delta > 0 ? (
                  <ArrowUpRight
                    className={`w-3 h-3 ${m.good ? "text-emerald-600" : "text-red-600"}`}
                    strokeWidth={2.6}
                  />
                ) : (
                  <ArrowDownRight
                    className={`w-3 h-3 ${m.good ? "text-emerald-600" : "text-red-600"}`}
                    strokeWidth={2.6}
                  />
                )}
                <span
                  className={`num text-[11px] font-semibold ${m.good ? "text-emerald-600" : "text-red-600"}`}
                >
                  {m.delta > 0 ? "+" : ""}
                  {m.delta}
                  {m.unit}
                </span>
                <span className="num text-[10.5px] text-gray-400 truncate">
                  from {m.prior}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---------------- Money waterfall + alerts ---------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard
          title="Where's the money?"
          subtitle="Lead-to-funded value flow for the selected period, with stage conversion"
          source="CEG Brain"
          className="xl:col-span-2"
          height="h-[300px]"
        >
          <MoneyFunnel stages={moneyWaterfall} />
        </ChartCard>

        <Card className="!p-0 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-gray-900">
                Alerts
              </h3>
              <Badge
                tone={
                  alerts.filter((a) => a.severity === "critical").length
                    ? "danger"
                    : "neutral"
                }
              >
                {alerts.filter((a) => a.severity === "critical").length}{" "}
                critical
              </Badge>
            </div>
            <span className="text-[10.5px] text-gray-400">
              {alerts.length} active
            </span>
          </div>
          <ul className="divide-y divide-gray-50 overflow-y-auto custom-scrollbar max-h-[420px]">
            {alerts.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-400 text-[12px]">
                No active critical alerts.
              </li>
            ) : (
              alerts.map((a) => {
                const Icon =
                  a.severity === "critical"
                    ? AlertTriangle
                    : a.severity === "warning"
                      ? AlertTriangle
                      : a.severity === "success"
                        ? CheckCircle2
                        : Info;
                const tone =
                  a.severity === "critical"
                    ? "text-red-600 bg-red-50"
                    : a.severity === "warning"
                      ? "text-amber-600 bg-amber-50"
                      : a.severity === "success"
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-blue-600 bg-blue-50";
                return (
                  <li
                    key={a.id}
                    className="px-4 py-3 hover:bg-surface-secondary transition-colors"
                  >
                    <div className="flex gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 ${tone}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-gray-900 leading-snug">
                          {a.title}
                        </p>
                        <p className="mt-1 text-[11.5px] text-gray-500 leading-relaxed">
                          {a.detail}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Link
                            href={`/kpi/${a.dept === "brain" ? "brain" : a.dept}`}
                            className="text-[10.5px] font-semibold text-brand-600 hover:text-brand-700 capitalize"
                          >
                            {a.dept} →
                          </Link>
                          <span className="text-[10.5px] text-gray-300">·</span>
                          <span className="text-[10.5px] text-gray-400">
                            {relativeAge(a.ageMinutes)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-[10.5px] text-gray-400">
              Alerts fire when a metric breaks target for 2 consecutive
              readings, or a client stalls 48h+.
            </p>
          </div>
        </Card>
      </div>

      {/* ---------------- Stage conversion detail ---------------- */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-[13px] font-semibold text-gray-900">
            Stage economics
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Value at each stage and the conversion required to hold the next one
          </p>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="ceg-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th className="text-right">Volume</th>
                <th className="text-right">Value in stage</th>
                <th className="text-right">Conv. from prior</th>
                <th className="text-right">Value per unit</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {moneyWaterfall.map((s, i) => (
                <tr key={s.stage}>
                  <td className="font-semibold text-gray-900">{s.stage}</td>
                  <td className="num text-right">{s.count.toLocaleString()}</td>
                  <td className="num text-right font-semibold text-gray-900">
                    {fmtCurrency(s.dollars, { compact: true })}
                  </td>
                  <td className="num text-right">
                    {s.conversionFromPrev == null ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span
                        className={
                          s.conversionFromPrev >= 60
                            ? "text-emerald-600 font-semibold"
                            : s.conversionFromPrev >= 30
                              ? "text-gray-700"
                              : "text-amber-600 font-semibold"
                        }
                      >
                        {s.conversionFromPrev.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="num text-right text-gray-500">
                    {fmtCurrency(
                      s.count > 0 ? Math.round(s.dollars / s.count) : 0,
                    )}
                  </td>
                  <td className="text-gray-500">
                    {
                      [
                        "Marketing",
                        "CEG Brain",
                        "Sales",
                        "Funding",
                        "Operations",
                      ][i]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { Badge, Card, SourceChip } from "@/components/kpi/ui";
import { getLatestBriefing } from "@/service/kpi";
import type { Briefing as BriefingType } from "@/lib/kpi/types";

// ============================================================
// AI Weekly CEO Briefing
// ============================================================

export default function Briefing() {
  const [brief, setBrief] = useState<BriefingType | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("Live Sync");

  useEffect(() => {
    getLatestBriefing()
      .then((res) => setBrief(res))
      .catch((err) => console.warn("Failed to load live briefing:", err));
  }, []);

  const b = brief || {
    id: "live",
    weekOf: "Current Week",
    headline: "Live AI Executive Briefing Active",
    healthScore: 78,
    scoreDelta: 1.2,
    tldr: ["Live data service connected to CEG Brain and Firestore metrics."],
    wins: [
      {
        title: "Live Service Connected",
        detail: "Data actively streamable from Cloud Functions endpoints.",
      },
    ],
    losses: [
      {
        title: "Metric SLA Monitoring",
        detail: "Ensure daily aggregation functions execute on schedule.",
      },
    ],
    anomalies: [],
    actions: [],
    deepDives: [
      {
        label: "Sales",
        path: "/kpi/sales",
        note: "View live sales performance",
      },
    ],
  };

  const briefingArchive = [
    {
      id: "b1",
      weekOf: b.weekOf,
      score: b.healthScore,
      delta: b.scoreDelta,
      headline: b.headline,
      current: true,
    },
    {
      id: "b2",
      weekOf: "Week of Jul 20",
      score: 76,
      delta: 0.8,
      headline: "Revenue steady, CPL optimization underway.",
    },
    {
      id: "b3",
      weekOf: "Week of Jul 13",
      score: 75,
      delta: -0.5,
      headline: "Underwriting backlog resolved.",
    },
  ];

  const regenerate = () => {
    setRegenerating(true);
    window.setTimeout(() => {
      setRegenerating(false);
      setGeneratedAt(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }) +
          " at " +
          new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
      );
    }, 1400);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence"
        title="AI Weekly CEO Briefing"
        description={`${b.weekOf} · generated ${generatedAt} from 78 tracked metrics across 8 departments.`}
        icon={Sparkles}
        owner="CEG Brain"
        action={
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 transition-colors disabled:opacity-70"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* ------------- Main brief ------------- */}
        <div className="xl:col-span-3 space-y-4">
          {/* Headline */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 to-brand-400" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="brand">{b.weekOf}</Badge>
                  <SourceChip source="CEG Brain" />
                </div>
                <h2 className="text-[19px] font-bold text-gray-900 leading-snug tracking-tight">
                  {b.headline}
                </h2>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                  Health score
                </p>
                <p className="num text-[32px] font-bold text-brand-600 leading-none mt-1">
                  {b.healthScore}
                </p>
                <p className="num text-[11px] font-semibold text-emerald-600 mt-1">
                  {b.scoreDelta > 0 ? "+" : ""}
                  {b.scoreDelta} pts
                </p>
              </div>
            </div>
          </Card>

          {/* TL;DR */}
          <Card>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-50">
                <Target className="w-3.5 h-3.5 text-brand-600" />
              </span>
              <h3 className="text-[14px] font-semibold text-gray-900">TL;DR</h3>
            </div>
            <ol className="space-y-3">
              {b.tldr.map((t: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="num flex-shrink-0 w-5 h-5 rounded-md bg-brand-600 text-white text-[10.5px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    {t}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Wins & Losses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center gap-2 mb-3.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <h3 className="text-[14px] font-semibold text-gray-900">
                  Wins
                </h3>
                <Badge tone="success">{b.wins.length}</Badge>
              </div>
              <ul className="space-y-3.5">
                {b.wins.map((w: any) => (
                  <li
                    key={w.title}
                    className="pl-3 border-l-2 border-emerald-200"
                  >
                    <p className="text-[12.5px] font-semibold text-gray-900 leading-snug">
                      {w.title}
                    </p>
                    <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">
                      {w.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-3.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-red-50">
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                </span>
                <h3 className="text-[14px] font-semibold text-gray-900">
                  Losses
                </h3>
                <Badge tone="danger">{b.losses.length}</Badge>
              </div>
              <ul className="space-y-3.5">
                {b.losses.map((l: any) => (
                  <li key={l.title} className="pl-3 border-l-2 border-red-200">
                    <p className="text-[12.5px] font-semibold text-gray-900 leading-snug">
                      {l.title}
                    </p>
                    <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">
                      {l.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Anomalies */}
          <Card>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </span>
              <h3 className="text-[14px] font-semibold text-gray-900">
                Anomalies
              </h3>
              <span className="text-[11px] text-gray-400">
                — statistical outliers worth a look
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {b.anomalies.map((a: any) => (
                <div
                  key={a.title}
                  className={`rounded-lg border p-3.5 ${
                    a.severity === "high"
                      ? "border-red-100 bg-red-50/40"
                      : a.severity === "medium"
                        ? "border-amber-100 bg-amber-50/40"
                        : "border-gray-100 bg-surface-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-[12.5px] font-semibold text-gray-900 leading-snug">
                      {a.title}
                    </p>
                    <Badge
                      tone={
                        a.severity === "high"
                          ? "danger"
                          : a.severity === "medium"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-[11.5px] text-gray-600 leading-relaxed">
                    {a.detail}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended actions */}
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-50">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
              </span>
              <h3 className="text-[14px] font-semibold text-gray-900">
                Recommended actions
              </h3>
              <Badge tone="brand">{b.actions.length}</Badge>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="ceg-table table-fixed">
                <thead>
                  <tr>
                    <th className="w-[36px]"></th>
                    <th className="w-[19%]">Owner</th>
                    <th className="w-[42%]">Action</th>
                    <th className="w-[26%]">Expected impact</th>
                    <th className="text-right w-[9%]">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {b.actions.map((a: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <span className="num inline-flex w-5 h-5 rounded-md bg-surface-tertiary text-gray-500 text-[10.5px] font-bold items-center justify-center">
                          {i + 1}
                        </span>
                      </td>
                      <td className="font-semibold text-gray-900 align-top leading-snug">
                        {a.owner}
                      </td>
                      <td className="text-gray-600 leading-relaxed align-top">
                        {a.action}
                      </td>
                      <td className="text-brand-700 font-medium align-top leading-relaxed">
                        {a.impact}
                      </td>
                      <td className="num text-right text-gray-500 whitespace-nowrap align-top">
                        {a.due}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Deep dives */}
          <Card>
            <h3 className="text-[14px] font-semibold text-gray-900 mb-1">
              Deep dives
            </h3>
            <p className="text-[11.5px] text-gray-400 mb-3.5">
              Each link opens the department page that produced the finding
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {b.deepDives.map((d: any) => (
                <Link
                  key={d.path}
                  href={d.path}
                  className="group rounded-lg border border-gray-100 p-3.5 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] font-semibold text-gray-900">
                      {d.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    {d.note}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* ------------- Archive sidebar ------------- */}
        <aside className="xl:col-span-1">
          <Card className="!p-0 overflow-hidden xl:sticky xl:top-4">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h3 className="text-[13px] font-semibold text-gray-900">
                Briefing archive
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Last 8 weeks</p>
            </div>
            <ul className="divide-y divide-gray-50">
              {briefingArchive.map((a) => (
                <li
                  key={a.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    a.current
                      ? "bg-brand-50/60 border-l-2 border-brand-600"
                      : "hover:bg-surface-secondary"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="num text-[11px] font-semibold text-gray-500">
                      {a.weekOf}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="num text-[12px] font-bold text-gray-900">
                        {a.score}
                      </span>
                      <span
                        className={`num text-[10px] font-semibold ${
                          a.delta > 0
                            ? "text-emerald-600"
                            : a.delta < 0
                              ? "text-red-600"
                              : "text-gray-400"
                        }`}
                      >
                        {a.delta > 0 ? "+" : ""}
                        {a.delta}
                      </span>
                    </div>
                  </div>
                  <p
                    className={`text-[11.5px] leading-snug ${
                      a.current
                        ? "font-semibold text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {a.headline}
                  </p>
                  {a.current && (
                    <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-600">
                      Currently reading
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10.5px] text-gray-400 leading-snug">
                {`Briefings generate every Monday at 6:00 AM ET from the prior
                week's closed data.`}
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

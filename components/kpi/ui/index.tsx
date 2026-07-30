"use client";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Database } from "lucide-react";
import type { MetricSource, MetricStatus } from "@/lib/kpi/types";
import { Card as UICard } from "@/components/ui/card";

// ============================================
// Shared primitives — source chip, delta, cards, tables
// ============================================

const SOURCE_STYLE: Record<MetricSource, string> = {
  HubSpot: "bg-orange-50 text-orange-700 border-orange-100",
  Firebase: "bg-amber-50 text-amber-700 border-amber-100",
  "CEG Brain": "bg-brand-50 text-brand-700 border-brand-100",
  "Meta Ads": "bg-blue-50 text-blue-700 border-blue-100",
  "Google Ads": "bg-emerald-50 text-emerald-700 border-emerald-100",
  Stripe: "bg-indigo-50 text-indigo-700 border-indigo-100",
  QuickBooks: "bg-teal-50 text-teal-700 border-teal-100",
  Plaid: "bg-slate-50 text-slate-600 border-slate-200",
  Manual: "bg-gray-50 text-gray-500 border-gray-200",
};

/** Data-lineage chip shown on every KPI tile. */
export function SourceChip({
  source,
  title,
}: {
  source: MetricSource;
  title?: string;
}) {
  return (
    <span
      title={title ?? `Source of record: ${source}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap ${SOURCE_STYLE[source]}`}
    >
      <Database className="w-2.5 h-2.5" strokeWidth={2.4} />
      {source}
    </span>
  );
}

export function Delta({
  value,
  higherIsBetter = true,
  suffix = "%",
  size = "sm",
}: {
  value: number;
  higherIsBetter?: boolean;
  suffix?: string;
  size?: "sm" | "md" | "lg";
}) {
  const flat = Math.abs(value) < 0.05;
  const good = higherIsBetter ? value > 0 : value < 0;
  const color = flat
    ? "text-gray-400"
    : good
      ? "text-emerald-600"
      : "text-red-600";
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const text =
    size === "lg" ? "text-sm" : size === "md" ? "text-[13px]" : "text-[11.5px]";
  const iconSize =
    size === "lg" ? "w-4 h-4" : size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold ${color} ${text}`}
    >
      <Icon className={iconSize} strokeWidth={2.6} />
      <span className="num">
        {Math.abs(value).toFixed(1)}
        {suffix}
      </span>
    </span>
  );
}

export function StatusDot({ status }: { status: MetricStatus }) {
  const c =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : status === "danger"
          ? "bg-red-500"
          : "bg-blue-500";
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${c}`} />
  );
}

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <UICard className={`gap-0 ${padded ? "p-5" : "p-0"} ${className}`}>
      {children}
    </UICard>
  );
}

export function ChartCard({
  title,
  subtitle,
  source,
  action,
  children,
  className = "",
  height = "h-[268px]",
}: {
  title: string;
  subtitle?: string;
  source?: MetricSource;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  height?: string;
}) {
  return (
    <UICard className={`p-5 gap-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold text-gray-900 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[11.5px] text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
          {source && <SourceChip source={source} />}
        </div>
      </div>
      <div className={height}>{children}</div>
    </UICard>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-gray-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function TableCard({
  title,
  subtitle,
  source,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  source?: MetricSource;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <UICard className="p-0 gap-0 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <h3 className="text-[13.5px] font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11.5px] text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {source && <SourceChip source={source} />}
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">{children}</div>
    </UICard>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "brand";
}) {
  const map = {
    neutral: "bg-gray-100 text-gray-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    brand: "bg-brand-50 text-brand-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/** Thin progress meter used in tables and scorecards. */
export function Meter({
  value,
  max,
  tone = "brand",
}: {
  value: number;
  max: number;
  tone?: "brand" | "success" | "warning" | "danger";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = {
    brand: "bg-brand-600",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <div className="w-full h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
      <div
        className={`h-full rounded-full ${bg} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Avatar({
  initials,
  tone = "brand",
}: {
  initials: string;
  tone?: "brand" | "gray";
}) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10.5px] font-bold flex-shrink-0 ${
        tone === "brand"
          ? "bg-brand-100 text-brand-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {initials}
    </span>
  );
}

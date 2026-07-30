"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, axisDollar, fmtCurrency, fmtNumber } from "@/lib/kpi/format";

// ============================================
// Chart library — light CEG styling, one place.
// ============================================

const AXIS = {
  stroke: "#e2e8f0",
  tick: { fill: "#94a3b8", fontSize: 11 },
  tickLine: false,
};

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-card-hover px-3 py-2 text-[12px]">
      {children}
    </div>
  );
}

function Row({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      )}
      <span className="text-gray-500">{label}</span>
      <span className="num ml-auto font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function makeTooltip(fmt: (v: number) => string) {
  return function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <TooltipBox>
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p: any) => (
          <Row
            key={p.dataKey}
            color={p.color || p.fill}
            label={p.name}
            value={fmt(p.value)}
          />
        ))}
      </TooltipBox>
    );
  };
}

const DollarTip = makeTooltip((v) => fmtCurrency(v));
const NumTip = makeTooltip((v) => fmtNumber(v, v % 1 === 0 ? 0 : 1));
const PctTip = makeTooltip((v) => `${Number(v).toFixed(1)}%`);

// ------------------------------------------------------------
// Trend area — for daily/weekly series
// ------------------------------------------------------------
export function TrendArea({
  data,
  xKey,
  series,
  dollars = false,
  percent = false,
  showGrid = true,
}: {
  data: any[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  dollars?: boolean;
  percent?: boolean;
  showGrid?: boolean;
}) {
  const Tip = dollars ? DollarTip : percent ? PctTip : NumTip;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 6, right: 6, bottom: 0, left: -12 }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.24} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid stroke={COLORS.grid} vertical={false} />}
        <XAxis
          dataKey={xKey}
          {...AXIS}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          {...AXIS}
          tickFormatter={(v) =>
            dollars ? axisDollar(v) : percent ? `${v}%` : fmtNumber(v)
          }
          width={54}
        />
        <Tooltip content={<Tip />} />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 6 }}
          />
        )}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------
// Bar comparison — horizontal or vertical
// ------------------------------------------------------------
export function BarCompare({
  data,
  xKey,
  series,
  dollars = false,
  horizontal = false,
  target,
  stacked = false,
}: {
  data: any[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  dollars?: boolean;
  horizontal?: boolean;
  target?: number;
  stacked?: boolean;
}) {
  const Tip = dollars ? DollarTip : NumTip;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 6, right: 12, bottom: 0, left: horizontal ? 8 : -12 }}
        barCategoryGap={horizontal ? "26%" : "32%"}
      >
        <CartesianGrid
          stroke={COLORS.grid}
          vertical={horizontal}
          horizontal={!horizontal}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              {...AXIS}
              tickFormatter={(v) => (dollars ? axisDollar(v) : fmtNumber(v))}
            />
            <YAxis type="category" dataKey={xKey} {...AXIS} width={124} />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              {...AXIS}
              interval={0}
              tick={{ fill: "#94a3b8", fontSize: 10.5 }}
            />
            <YAxis
              {...AXIS}
              tickFormatter={(v) => (dollars ? axisDollar(v) : fmtNumber(v))}
              width={54}
            />
          </>
        )}
        <Tooltip content={<Tip />} cursor={{ fill: "#f8fafc" }} />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 6 }}
          />
        )}
        {target != null && (
          <ReferenceLine
            {...(horizontal ? { x: target } : { y: target })}
            stroke={COLORS.warning}
            strokeDasharray="4 4"
            label={{
              value: "Target",
              fill: COLORS.warning,
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
        )}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]}
            stackId={stacked ? "a" : undefined}
            maxBarSize={horizontal ? 20 : 44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------
// Donut — source breakdowns
// ------------------------------------------------------------
export function Donut({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-full flex items-center">
      <div className="w-[52%] h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <TooltipBox>
                    <Row
                      color={p.payload.color}
                      label={p.name}
                      value={`${fmtNumber(p.value)} · ${((p.value / total) * 100).toFixed(1)}%`}
                    />
                  </TooltipBox>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="absolute left-0 top-0 w-[52%] h-full flex flex-col items-center justify-center pointer-events-none">
            <span className="num text-[22px] font-semibold text-gray-900 leading-none">
              {centerValue}
            </span>
            {centerLabel && (
              <span className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-400">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <ul className="flex-1 pl-4 space-y-1.5 min-w-0">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-[12px]">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: d.color }}
            />
            <span className="text-gray-600 truncate">{d.name}</span>
            <span className="num ml-auto font-semibold text-gray-900">
              {fmtNumber(d.value)}
            </span>
            <span className="num text-gray-400 w-11 text-right">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------
// Multi-line trend
// ------------------------------------------------------------
export function MultiLine({
  data,
  xKey,
  series,
  dollars = false,
  percent = false,
  target,
  dashedKeys = [],
}: {
  data: any[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  dollars?: boolean;
  percent?: boolean;
  target?: number;
  dashedKeys?: string[];
}) {
  const Tip = dollars ? DollarTip : percent ? PctTip : NumTip;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 6, right: 10, bottom: 0, left: -12 }}
      >
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          {...AXIS}
          interval="preserveStartEnd"
          minTickGap={18}
        />
        <YAxis
          {...AXIS}
          tickFormatter={(v) =>
            dollars ? axisDollar(v) : percent ? `${v}%` : fmtNumber(v)
          }
          width={56}
        />
        <Tooltip content={<Tip />} />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 6 }}
          />
        )}
        {target != null && (
          <ReferenceLine
            y={target}
            stroke={COLORS.warning}
            strokeDasharray="4 4"
            label={{
              value: "Target",
              fill: COLORS.warning,
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.2}
            strokeDasharray={dashedKeys.includes(s.key) ? "5 4" : undefined}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------
// Histogram — distributions (days in stage, audit→payment)
// ------------------------------------------------------------
export function Histogram({
  data,
  xKey = "bucket",
  yKey = "count",
  color = COLORS.brand600,
  highlightIndex,
}: {
  data: any[];
  xKey?: string;
  yKey?: string;
  color?: string;
  highlightIndex?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 6, right: 6, bottom: 0, left: -16 }}
        barCategoryGap="14%"
      >
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          {...AXIS}
          interval={0}
          tick={{ fill: "#94a3b8", fontSize: 10.5 }}
        />
        <YAxis {...AXIS} width={44} />
        <Tooltip content={<NumTip />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]} maxBarSize={54}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === highlightIndex ? COLORS.warning : color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------
// MRR waterfall — signed bars with a floating base
// ------------------------------------------------------------
export interface WaterfallItem {
  label: string;
  value: number;
  type: "total" | "inc" | "dec" | "positive" | "negative";
}

export function Waterfall({ data }: { data: WaterfallItem[] }) {
  let running = 0;
  const rows = data.map((d) => {
    if (d.type === "total") {
      running = d.value;
      return { ...d, base: 0, bar: d.value, display: d.value };
    }
    const base = d.value >= 0 ? running : running + d.value;
    const bar = Math.abs(d.value);
    running += d.value;
    return { ...d, base, bar, display: d.value };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={rows}
        margin={{ top: 6, right: 6, bottom: 0, left: -8 }}
        barCategoryGap="28%"
      >
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis
          dataKey="label"
          {...AXIS}
          interval={0}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
        />
        <YAxis {...AXIS} tickFormatter={axisDollar} width={56} />
        <Tooltip
          content={({ active, payload }: any) => {
            if (!active || !payload?.length) return null;
            const p = payload[0]?.payload;
            if (!p) return null;
            return (
              <TooltipBox>
                <p className="font-semibold text-gray-900 mb-1">{p.label}</p>
                <Row
                  color={
                    p.type === "total"
                      ? COLORS.brand600
                      : p.display >= 0
                        ? COLORS.success
                        : COLORS.danger
                  }
                  label={p.type === "total" ? "Balance" : "Change"}
                  value={`${p.display > 0 && p.type !== "total" ? "+" : ""}${fmtCurrency(p.display)}`}
                />
              </TooltipBox>
            );
          }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar dataKey="base" stackId="w" fill="transparent" />
        <Bar dataKey="bar" stackId="w" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {rows.map((r, i) => (
            <Cell
              key={i}
              fill={
                r.type === "total"
                  ? COLORS.brand900
                  : r.display >= 0
                    ? COLORS.success
                    : COLORS.danger
              }
            />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------
// Money waterfall / funnel — the "Where's the money?" chart
// ------------------------------------------------------------
export function MoneyFunnel({
  stages,
}: {
  stages: {
    stage: string;
    count: number;
    dollars: number;
    conversionFromPrev: number | null;
  }[];
}) {
  if (!stages || stages.length === 0) return null;
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 h-full">
      {stages.map((s, i) => {
        const h = Math.max(14, (s.count / maxCount) * 100);
        const shades = ["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1e3a5f"];
        return (
          <div key={s.stage} className="flex flex-col justify-end min-w-0">
            <div className="flex items-baseline justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-gray-600 truncate">
                {s.stage}
              </span>
              {s.conversionFromPrev != null && (
                <span className="num text-[10px] font-semibold text-brand-600 whitespace-nowrap">
                  {s.conversionFromPrev.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="relative flex-1 flex flex-col justify-end">
              <div
                className="rounded-t-lg rounded-b-sm transition-all duration-700 flex flex-col justify-start items-start px-2.5 pt-2 overflow-hidden"
                style={{
                  height: `${h}%`,
                  background: shades[i],
                  minHeight: 58,
                }}
              >
                <span className="num text-[15px] font-bold text-white leading-none">
                  {fmtCurrency(s.dollars, { compact: true })}
                </span>
                <span className="num text-[10.5px] font-medium text-white/80 mt-1">
                  {fmtNumber(s.count)}{" "}
                  {i === 0
                    ? "leads"
                    : i === 1
                      ? "audits"
                      : i === 2
                        ? "paid"
                        : i === 3
                          ? "approvals"
                          : "funded"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Horizontal funnel bars — marketing funnel
// ------------------------------------------------------------
export interface FunnelStageItem {
  stage: string;
  count: number;
  pct?: number | null;
  conversion?: number | null;
}

export function FunnelBars({ stages }: { stages: FunnelStageItem[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  const shades = [
    "#dbeafe",
    "#bfdbfe",
    "#93c5fd",
    "#60a5fa",
    "#3b82f6",
    "#2563eb",
  ];
  return (
    <div className="h-full flex flex-col justify-between gap-1.5">
      {stages.map((s, i) => {
        const pctVal = s.pct ?? s.conversion;
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <span className="w-[92px] text-[11.5px] text-gray-500 flex-shrink-0 truncate">
              {s.stage}
            </span>
            <div className="flex-1 h-7 bg-surface-tertiary rounded-md relative">
              {(() => {
                const w = Math.max(2, (s.count / max) * 100);
                const inside = w > 14;
                return (
                  <>
                    <div
                      className="h-full rounded-md transition-all duration-700"
                      style={{
                        width: `${w}%`,
                        background: shades[i % shades.length],
                      }}
                    />
                    <span
                      className={`num absolute top-0 h-full flex items-center text-[11px] font-bold ${
                        inside
                          ? i >= 4
                            ? "text-white"
                            : "text-brand-900"
                          : "text-gray-600"
                      }`}
                      style={
                        inside ? { left: 8 } : { left: `calc(${w}% + 8px)` }
                      }
                    >
                      {fmtNumber(s.count)}
                    </span>
                  </>
                );
              })()}
            </div>
            <span className="num w-14 text-right text-[11px] font-semibold text-gray-500 flex-shrink-0">
              {i === 0 || pctVal == null ? "—" : `${pctVal.toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  RefreshCw,
  ChevronDown,
  Check,
  Wifi,
  WifiOff,
  Download,
  ArrowLeft,
} from "lucide-react";
import { RANGE_OPTIONS, useDateRange } from "@/hooks/kpi/useDateRange";
import { useSyncStatus } from "@/hooks/kpi/useKPI";

// ============================================
// Top bar — date range, refresh, sync status
// ============================================

export function TopBar() {
  const { range, setRange, label, refresh, refreshing, refreshedAt } =
    useDateRange();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const sync = useSyncStatus();

  const stale = sync.filter((s) => s.status !== "live").length;
  const allLive = stale === 0;

  return (
    <header className="h-[58px] bg-white/85 backdrop-blur-sm border-b border-gray-200 flex items-center gap-2 px-4 pl-14 lg:pl-6 flex-shrink-0 sticky top-0 z-30">
      {/* Back to Admin link */}
      <Link
        href="/admin/home"
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-brand-300 hover:bg-surface-secondary transition-colors mr-1"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
        <span className="hidden sm:inline">Back to Admin</span>
      </Link>
      {/* Range picker */}
      <div className="relative">
        <button
          onClick={() => {
            setRangeOpen((o) => !o);
            setSyncOpen(false);
          }}
          className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:border-brand-300 hover:bg-surface-secondary transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">
            {RANGE_OPTIONS.find((o) => o.key === range)?.short}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {rangeOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setRangeOpen(false)}
            />
            <div className="absolute left-0 top-11 z-20 w-56 bg-white rounded-xl border border-gray-100 shadow-card-hover py-1.5 animate-scale-in origin-top-left">
              {RANGE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => {
                    setRange(o.key);
                    setRangeOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-gray-700 hover:bg-surface-secondary"
                >
                  {o.label}
                  {range === o.key && (
                    <Check className="w-3.5 h-3.5 text-brand-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick range chips */}
      <div className="hidden xl:flex items-center gap-1 ml-1">
        {RANGE_OPTIONS.slice(0, 5).map((o) => (
          <button
            key={o.key}
            onClick={() => setRange(o.key)}
            className={`px-2.5 h-7 rounded-md text-[12px] font-medium transition-colors ${
              range === o.key
                ? "bg-brand-50 text-brand-700"
                : "text-gray-500 hover:bg-surface-tertiary"
            }`}
          >
            {o.short}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Export */}
      <button className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:border-brand-300 hover:bg-surface-secondary transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {/* Refresh */}
      <button
        onClick={refresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:border-brand-300 hover:bg-surface-secondary transition-colors disabled:opacity-60"
        title="Refresh all metrics"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-600" : ""}`}
        />
        <span className="hidden sm:inline">
          {refreshing ? "Syncing…" : "Refresh"}
        </span>
      </button>

      {/* Sync status */}
      <div className="relative">
        <button
          onClick={() => {
            setSyncOpen((o) => !o);
            setRangeOpen(false);
          }}
          className={`flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
            allLive
              ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
          title="Data source sync status"
        >
          {allLive ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {allLive
              ? "All sources live"
              : `${stale} source${stale > 1 ? "s" : ""} stale`}
          </span>
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                allLive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                allLive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
        </button>
        {syncOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setSyncOpen(false)}
            />
            <div className="absolute right-0 top-11 z-20 w-64 bg-white rounded-xl border border-gray-100 shadow-card-hover py-2 animate-scale-in origin-top-right">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Source sync
              </p>
              {sync.map((s) => (
                <div
                  key={s.source}
                  className="flex items-center justify-between px-3 py-1.5 text-[12px]"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.status === "live"
                          ? "bg-success"
                          : s.status === "stale"
                            ? "bg-warning"
                            : "bg-danger"
                      }`}
                    />
                    {s.source}
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {s.lastSync}
                  </span>
                </div>
              ))}
              <div className="px-3 pt-2 mt-1 border-t border-gray-100 text-[11px] text-gray-400">
                Last full refresh{" "}
                {refreshedAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

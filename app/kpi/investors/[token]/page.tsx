"use client";
import { Lock, ShieldCheck, TrendingUp } from 'lucide-react'

import { CEGLogo } from '@/components/kpi/CEGLogo'
import { TrendArea } from '@/components/kpi/charts'
import { COLORS, fmtCurrency, fmtNumber, fmtPercent } from '@/lib/kpi/format'
import { INVESTOR_SNAPSHOT } from '@/lib/kpi/data/mock'

// ============================================================
// Investor Portal — read-only, token-gated, no operational data.
// Rendered OUTSIDE the app shell (no sidebar, no demo toolbar).
// Route: /#/investors/:token
// ============================================================

const s = INVESTOR_SNAPSHOT

export default function InvestorPortal({ params }: { params: { token: string } }) {
  const { token } = params

  const headline = [
    {
      label: 'Monthly Recurring Revenue',
      value: fmtCurrency(s.mrr),
      sub: `${fmtCurrency(s.arr, { compact: true })} ARR`,
      mom: s.mrrMoM,
      yoy: s.mrrYoY,
    },
    {
      label: 'Total Capital Facilitated (YTD)',
      value: fmtCurrency(s.capitalYTD, { compact: true }),
      sub: 'Jan 1 – Jul 28, 2026',
      yoy: s.capitalYoY,
    },
    {
      label: 'Active Clients',
      value: fmtNumber(s.activeClients),
      sub: 'Paying, in-program accounts',
      mom: s.clientsMoM,
    },
    {
      label: 'Client Lifetime Value',
      value: fmtCurrency(s.clientLTV),
      sub: 'Blended across all programs',
      yoy: s.ltvYoY,
    },
  ]

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-brand-900 text-white">
        <div className="max-w-[1080px] mx-auto px-6 sm:px-8 py-6 flex items-center justify-between gap-4">
          <CEGLogo size="default" wordmark="Investor Portal" onLight={false} />
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <Lock className="w-3.5 h-3.5" />
            <span className="num hidden sm:inline">
              {token ? `${token.slice(0, 12)}…` : 'read-only link'}
            </span>
            <span className="sm:hidden">Read-only</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        {/* Intro */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              CEG United
            </p>
            <h1 className="mt-1.5 text-[26px] sm:text-[30px] font-bold text-gray-900 tracking-tight leading-tight">
              Company Performance Summary
            </h1>
            <p className="mt-2 text-[13.5px] text-gray-500 max-w-[560px] leading-relaxed">
              A read-only view of the five headline metrics we report to investors. Figures are drawn
              directly from our systems of record and refresh nightly.
            </p>
          </div>
          <div className="flex-shrink-0 rounded-lg bg-white border border-gray-200 px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Data as of</p>
            <p className="num text-[13.5px] font-semibold text-gray-900 mt-0.5">{s.asOf}</p>
          </div>
        </div>

        {/* Growth banner */}
        <div className="rounded-xl bg-brand-600 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
              <TrendingUp className="w-4.5 h-4.5" />
            </span>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-white/70">
                MRR growth (MoM)
              </p>
              <p className="num text-[24px] font-bold leading-none mt-0.5">
                +{fmtPercent(s.mrrMoM)}
              </p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-white/20" />
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.12em] text-white/70">
              MRR growth (YoY)
            </p>
            <p className="num text-[24px] font-bold leading-none mt-0.5">+{fmtPercent(s.mrrYoY)}</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-white/20" />
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.12em] text-white/70">
              Capital facilitated (YoY)
            </p>
            <p className="num text-[24px] font-bold leading-none mt-0.5">
              +{fmtPercent(s.capitalYoY)}
            </p>
          </div>
        </div>

        {/* Headline metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {headline.map((m, i) => (
            <div
              key={m.label}
              className={`bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-fade-in-up stagger-${i + 1}`}
            >
              <p className="text-[11.5px] font-medium text-gray-500">{m.label}</p>
              <p className="num text-[34px] font-semibold text-gray-900 mt-2 leading-none tracking-tight">
                {m.value}
              </p>
              <p className="text-[11.5px] text-gray-400 mt-2">{m.sub}</p>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4">
                {m.mom != null && (
                  <span className="text-[11.5px] text-gray-500">
                    MoM{' '}
                    <span className="num font-semibold text-emerald-600">+{fmtPercent(m.mom)}</span>
                  </span>
                )}
                {m.yoy != null && (
                  <span className="text-[11.5px] text-gray-500">
                    YoY{' '}
                    <span className="num font-semibold text-emerald-600">+{fmtPercent(m.yoy)}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[13.5px] font-semibold text-gray-900">
              Monthly recurring revenue
            </h3>
            <p className="text-[11.5px] text-gray-400 mt-0.5 mb-3">Trailing 12 months</p>
            <div className="h-[228px]">
              <TrendArea
                data={s.mrrHistory}
                xKey="month"
                dollars
                series={[{ key: 'mrr', name: 'MRR', color: COLORS.brand600 }]}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[13.5px] font-semibold text-gray-900">Capital facilitated</h3>
            <p className="text-[11.5px] text-gray-400 mt-0.5 mb-3">Monthly funded volume, 2026 YTD</p>
            <div className="h-[228px]">
              <TrendArea
                data={s.capitalHistory}
                xKey="month"
                dollars
                series={[{ key: 'capital', name: 'Capital facilitated', color: COLORS.brand900 }]}
              />
            </div>
          </div>
        </div>

        {/* Scope disclosure */}
        <div className="rounded-xl bg-white border border-gray-200 p-5 flex items-start gap-3.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold text-gray-900">
              What this view intentionally excludes
            </p>
            <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed max-w-[720px]">
              This portal is limited to the five metrics above. It contains no client names, no
              employee or compensation data, no departmental or operational metrics, no pipeline
              detail, and no lender relationships. Access is scoped to this link and can be revoked
              at any time.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-[1080px] mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CEGLogo size="small" wordmark="" onLight />
            <span className="text-[11.5px] text-gray-400">
              Powered by <span className="font-semibold text-gray-600">CEG Brain</span>
            </span>
          </div>
          <p className="text-[11px] text-gray-400 text-center sm:text-right">
            Confidential · Prepared for authorised holders of this link · Data as of {s.asOf}
          </p>
        </div>
      </footer>
    </div>
  )
}

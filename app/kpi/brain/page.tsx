"use client";
import { BrainCircuit } from 'lucide-react'
import { Page, PageHeader } from '@/components/kpi/PageHeader'
import { KPIGrid, KPITile } from '@/components/kpi/KPITile'
import { Histogram, MultiLine } from '@/components/kpi/charts'
import { Badge, Card, ChartCard, Meter, TableCard } from '@/components/kpi/ui'
import { AI_MODEL_HEALTH, AUDIT_TO_PAYMENT_HISTOGRAM, AUDIT_VOLUME_TREND } from '@/lib/kpi/data/mock'
import { COLORS, fmtNumber, fmtPercent } from '@/lib/kpi/format'

// ============================================================
// CEG Brain Performance — the product engine itself
// ============================================================

const THROUGHPUT = ['audits_today', 'audits_week', 'audits_month', 'audit_completion_time']
const ENGAGEMENT = ['audit_view_rate', 'funding_map_click_rate', 'audit_to_payment', 'time_audit_to_payment']
const AI_HEALTH = ['ai_classifications', 'ai_confidence', 'human_review_rate', 'brain_uptime']

export default function Brain() {
  const totalCalls = AI_MODEL_HEALTH.reduce((s, m) => s + m.calls, 0)

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence"
        title="CEG Brain Performance"
        description="Audit throughput, client engagement with the audit and Funding Map, and the health of the AI layer underneath it. This is the margin engine."
        icon={BrainCircuit}
        owner="Simone Adeyemi"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Uptime</p>
              <p className="num text-[15px] font-semibold text-emerald-600">99.94%</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">AI calls / day</p>
              <p className="num text-[15px] font-semibold text-gray-900">{fmtNumber(totalCalls)}</p>
            </div>
          </div>
        }
      />

      {/* Throughput */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight mb-3">Audit throughput</h2>
        <KPIGrid metricIds={THROUGHPUT} cols={4} />
      </div>

      {/* Engagement */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight mb-1">
          Client engagement
        </h2>
        <p className="text-[12px] text-gray-400 mb-3">
          A 23-point drop-off between viewing the audit and opening the Funding Map is the largest
          single conversion leak in the product.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENGAGEMENT.map((id, i) => (
            <KPITile key={id} metricId={id} stagger={i + 1} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Audit volume & engagement"
          subtitle="Audits completed, audits viewed, and Funding Map clicks by week"
          source="CEG Brain"
        >
          <MultiLine
            data={AUDIT_VOLUME_TREND}
            xKey="week"
            series={[
              { key: 'audits', name: 'Audits completed', color: COLORS.brand600 },
              { key: 'viewed', name: 'Audits viewed', color: COLORS.success },
              { key: 'mapClicks', name: 'Funding Map clicks', color: COLORS.warning },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Time from audit to payment"
          subtitle="Distribution of elapsed time before the client pays — 12–24h is the mode"
          source="CEG Brain"
        >
          <Histogram data={AUDIT_TO_PAYMENT_HISTOGRAM} highlightIndex={2} />
        </ChartCard>
      </div>

      {/* AI health */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight mb-3">AI layer health</h2>
        <KPIGrid metricIds={AI_HEALTH} cols={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <TableCard
            title="Model-level health"
            subtitle="Daily call volume, average confidence, and the share requiring human review."
            source="CEG Brain"
          >
            <table className="ceg-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="text-right">Calls / day</th>
                  <th className="text-right">Avg confidence</th>
                  <th className="text-right">Human review</th>
                  <th className="w-[120px]">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {AI_MODEL_HEALTH.map((m) => (
                  <tr key={m.model}>
                    <td className="font-semibold text-gray-900 whitespace-nowrap">{m.model}</td>
                    <td className="num text-right">{fmtNumber(m.calls)}</td>
                    <td className="num text-right font-semibold text-gray-900">
                      {fmtPercent(m.confidence)}
                    </td>
                    <td className="num text-right">
                      <Badge tone={m.review <= 8 ? 'success' : m.review <= 12 ? 'warning' : 'danger'}>
                        {fmtPercent(m.review)}
                      </Badge>
                    </td>
                    <td>
                      <Meter
                        value={m.confidence}
                        max={100}
                        tone={m.confidence >= 93 ? 'success' : m.confidence >= 90 ? 'brand' : 'warning'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        {/* Engagement funnel readout */}
        <Card className="lg:col-span-2">
          <h3 className="text-[13.5px] font-semibold text-gray-900">Audit → payment path</h3>
          <p className="mt-0.5 text-[11.5px] text-gray-400 mb-4">
            Where clients fall out after the audit completes
          </p>
          <div className="space-y-3.5">
            {[
              { label: 'Audit completed', pct: 100, tone: 'brand' as const, n: '596' },
              { label: 'Viewed their audit', pct: 81.6, tone: 'brand' as const, n: '486' },
              { label: 'Clicked Funding Map', pct: 58.2, tone: 'warning' as const, n: '347' },
              { label: 'Started checkout', pct: 32.4, tone: 'warning' as const, n: '193' },
              { label: 'Paid', pct: 21.4, tone: 'success' as const, n: '128' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-gray-600">{s.label}</span>
                  <span className="num text-[12px] font-semibold text-gray-900">
                    {s.pct}% <span className="text-gray-300 font-normal">· {s.n}</span>
                  </span>
                </div>
                <Meter value={s.pct} max={100} tone={s.tone} />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11.5px] text-gray-500 leading-relaxed">
              Clients who open the Funding Map convert to payment at roughly{' '}
              <span className="font-semibold text-gray-900">2.4x</span> the rate of those who do not.
              Closing the 23-point view-to-map gap is worth an estimated{' '}
              <span className="font-semibold text-gray-900">+2 points</span> of audit→payment.
            </p>
          </div>
        </Card>
      </div>
    </Page>
  )
}

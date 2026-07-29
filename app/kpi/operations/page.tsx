"use client";
import { AlertTriangle, Settings2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/kpi/PageHeader'
import { KPIGrid } from '@/components/kpi/KPITile'
import { BarCompare } from '@/components/kpi/charts'
import { Badge, Card, ChartCard, Meter, TableCard } from '@/components/kpi/ui'
import { AM_LOAD, AT_RISK_CLIENTS, TASK_COMPLETION } from '@/lib/kpi/data/mock'
import { COLORS, fmtCurrency } from '@/lib/kpi/format'

// ============================================================
// Operations Department
// ============================================================

const TILES = [
  'tasks_on_time',
  'clients_stuck',
  'docs_pending',
  'clients_per_am',
  'apps_processed',
  'employee_sla',
  'first_response_time',
  'onboarding_time',
  'doc_rejection_rate',
  'automation_coverage',
]

export default function Operations() {
  const highRisk = AT_RISK_CLIENTS.filter((c) => c.severity === 'high')
  const atRiskValue = AT_RISK_CLIENTS.reduce((s, c) => s + c.value, 0)

  return (
    <Page>
      <PageHeader
        eyebrow="Department"
        title="Operations"
        description="Delivery throughput, SLA adherence, and every client currently stalled. Two account managers are over the 55-client capacity line."
        icon={Settings2}
        owner="Operations"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Value at risk</p>
              <p className="num text-[15px] font-semibold text-red-600">
                {fmtCurrency(atRiskValue, { compact: true })}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Stalled</p>
              <p className="num text-[15px] font-semibold text-gray-900">{AT_RISK_CLIENTS.length}</p>
            </div>
          </div>
        }
      />

      {/* Escalation banner */}
      <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-red-900">
            {highRisk.length} clients stalled 72+ hours — {fmtCurrency(highRisk.reduce((s, c) => s + c.value, 0), { compact: true })} in requested capital
          </p>
          <p className="text-[11.5px] text-red-700/80 mt-0.5">
            {highRisk.map((c) => `${c.name} (${c.hoursStuck}h)`).join(' · ')}
          </p>
        </div>
      </div>

      <KPIGrid metricIds={TILES} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Task completion"
          subtitle="On-time vs late task closure by week — target 92% on time"
          source="Firebase"
        >
          <BarCompare
            data={TASK_COMPLETION}
            xKey="week"
            stacked
            series={[
              { key: 'onTime', name: 'On time', color: COLORS.success },
              { key: 'late', name: 'Late', color: COLORS.danger },
            ]}
          />
        </ChartCard>

        <Card className="!p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-[13.5px] font-semibold text-gray-900">Account manager load</h3>
            <p className="mt-0.5 text-[11.5px] text-gray-400">
              Active clients against a 55-client capacity line
            </p>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {AM_LOAD.map((am) => {
              const over = am.clients > am.capacity
              return (
                <div key={am.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-gray-700">{am.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="num text-[11px] text-gray-400">{am.onTime}% on time</span>
                      <span
                        className={`num text-[12px] font-semibold ${over ? 'text-red-600' : 'text-gray-900'}`}
                      >
                        {am.clients}
                        <span className="text-gray-300">/{am.capacity}</span>
                      </span>
                    </div>
                  </div>
                  <Meter
                    value={am.clients}
                    max={Math.max(am.capacity, am.clients)}
                    tone={over ? 'danger' : am.clients >= am.capacity * 0.9 ? 'warning' : 'success'}
                  />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <TableCard
        title="At-risk clients"
        subtitle="Every client stalled past the 48-hour tolerance, sorted by time stuck."
        source="Firebase"
      >
        <table className="ceg-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Company</th>
              <th>Stage</th>
              <th className="text-right">Hours stuck</th>
              <th>Blocker</th>
              <th className="text-right">Value</th>
              <th>Owner</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {AT_RISK_CLIENTS.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-gray-900 whitespace-nowrap">{c.name}</td>
                <td className="text-gray-500 whitespace-nowrap">{c.company}</td>
                <td className="text-gray-500 whitespace-nowrap">{c.stage}</td>
                <td className="num text-right">
                  <span
                    className={
                      c.hoursStuck >= 72
                        ? 'text-red-600 font-bold'
                        : c.hoursStuck >= 56
                        ? 'text-amber-600 font-semibold'
                        : 'text-gray-600'
                    }
                  >
                    {c.hoursStuck}h
                  </span>
                </td>
                <td className="text-gray-500">{c.reason}</td>
                <td className="num text-right font-semibold text-gray-900">{fmtCurrency(c.value)}</td>
                <td className="text-gray-500 whitespace-nowrap">{c.owner}</td>
                <td>
                  <Badge tone={c.severity === 'high' ? 'danger' : c.severity === 'medium' ? 'warning' : 'neutral'}>
                    {c.severity}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </Page>
  )
}

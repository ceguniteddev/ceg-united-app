"use client";
import { TrendingUp } from 'lucide-react'
import { Page, PageHeader } from '@/components/kpi/PageHeader'
import { KPIGrid } from '@/components/kpi/KPITile'
import { BarCompare, MultiLine } from '@/components/kpi/charts'
import { Avatar, Badge, Card, ChartCard, Meter, TableCard } from '@/components/kpi/ui'
import { CLOSERS, CLOSE_RATE_TREND, DEAL_STAGES } from '@/lib/kpi/data/mock'
import { COLORS, fmtCurrency, fmtNumber, fmtPercent } from '@/lib/kpi/format'

// ============================================================
// Sales Department
// ============================================================

const TILES = [
  'sales_close_rate',
  'revenue_per_closer',
  'avg_contract_value',
  'cash_collected_mtd',
  'pipeline_value',
  'calls_taken',
  'deals_won_mtd',
  'avg_sales_cycle',
  'discount_rate',
  'followup_sla',
]

export default function Sales() {
  const revenueByCloser = CLOSERS.map((c) => ({
    name: c.name.split(' ')[0] + ' ' + c.name.split(' ')[1][0] + '.',
    revenue: c.revenue,
    collected: c.cashCollected,
  }))

  const totalRevenue = CLOSERS.reduce((s, c) => s + c.revenue, 0)
  const totalQuota = CLOSERS.reduce((s, c) => s + c.quota, 0)

  return (
    <Page>
      <PageHeader
        eyebrow="Department"
        title="Sales"
        description="Closer performance, pipeline coverage, and cash conversion. Close rate is the single most sensitive input to the company health score."
        icon={TrendingUp}
        owner="Sales leadership"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Team attainment</p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {fmtPercent((totalRevenue / totalQuota) * 100, 0)}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Closers</p>
              <p className="num text-[15px] font-semibold text-gray-900">{CLOSERS.length}</p>
            </div>
          </div>
        }
      />

      <KPIGrid metricIds={TILES} cols={5} />

      {/* Deal stages */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-[13px] font-semibold text-gray-900">Deals by stage</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Open pipeline distribution and weighted value</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y lg:divide-y-0 divide-gray-100">
          {DEAL_STAGES.map((s) => (
            <div key={s.stage} className="px-4 py-3.5">
              <p className="text-[11px] text-gray-500 truncate">{s.stage}</p>
              <p className="num text-[21px] font-semibold text-gray-900 mt-1 leading-none">
                {fmtNumber(s.count)}
              </p>
              <p className="num text-[11px] text-gray-400 mt-1.5">
                {s.dollars ? fmtCurrency(s.dollars, { compact: true }) : '—'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Revenue by closer"
          subtitle="Booked revenue vs cash actually collected, month to date"
          source="HubSpot"
        >
          <BarCompare
            data={revenueByCloser}
            xKey="name"
            dollars
            series={[
              { key: 'revenue', name: 'Booked', color: COLORS.brand600 },
              { key: 'collected', name: 'Collected', color: COLORS.brand300 },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Close rate trend"
          subtitle="Weekly close rate against the 30% target — 12 weeks"
          source="HubSpot"
        >
          <MultiLine
            data={CLOSE_RATE_TREND}
            xKey="week"
            percent
            target={30}
            series={[{ key: 'rate', name: 'Close rate', color: COLORS.brand600 }]}
          />
        </ChartCard>
      </div>

      {/* Leaderboard table */}
      <TableCard
        title="Closer leaderboard"
        subtitle="Ranked by booked revenue. Quota attainment shown against individual targets."
        source="HubSpot"
      >
        <table className="ceg-table">
          <thead>
            <tr>
              <th>Closer</th>
              <th className="text-right">Calls</th>
              <th className="text-right">Deals</th>
              <th className="text-right">Close rate</th>
              <th className="text-right">Avg contract</th>
              <th className="text-right">Booked revenue</th>
              <th className="text-right">Cash collected</th>
              <th className="w-[160px]">Quota attainment</th>
            </tr>
          </thead>
          <tbody>
            {CLOSERS.map((c) => {
              const att = (c.revenue / c.quota) * 100
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={c.initials} />
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{c.name}</span>
                    </div>
                  </td>
                  <td className="num text-right">{c.callsTaken}</td>
                  <td className="num text-right">{c.deals}</td>
                  <td className="num text-right">
                    <Badge tone={c.closeRate >= 30 ? 'success' : c.closeRate >= 26 ? 'warning' : 'danger'}>
                      {fmtPercent(c.closeRate)}
                    </Badge>
                  </td>
                  <td className="num text-right">{fmtCurrency(c.avgContract)}</td>
                  <td className="num text-right font-semibold text-gray-900">{fmtCurrency(c.revenue)}</td>
                  <td className="num text-right text-gray-500">{fmtCurrency(c.cashCollected)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Meter
                        value={c.revenue}
                        max={c.quota}
                        tone={att >= 100 ? 'success' : att >= 85 ? 'brand' : att >= 70 ? 'warning' : 'danger'}
                      />
                      <span className="num text-[11px] font-semibold text-gray-600 w-9 text-right">
                        {att.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface-secondary">
              <td className="px-4 py-3 font-semibold text-gray-900 text-[13px]">Team total</td>
              <td className="num px-4 py-3 text-right font-semibold">
                {CLOSERS.reduce((s, c) => s + c.callsTaken, 0)}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">
                {CLOSERS.reduce((s, c) => s + c.deals, 0)}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">27.4%</td>
              <td className="num px-4 py-3 text-right font-semibold">$7,280</td>
              <td className="num px-4 py-3 text-right font-semibold text-gray-900">
                {fmtCurrency(totalRevenue)}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">
                {fmtCurrency(CLOSERS.reduce((s, c) => s + c.cashCollected, 0))}
              </td>
              <td className="num px-4 py-3 font-semibold">
                {fmtPercent((totalRevenue / totalQuota) * 100, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </TableCard>
    </Page>
  )
}

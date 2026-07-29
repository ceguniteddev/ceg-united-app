"use client";
import { Megaphone } from 'lucide-react'
import { Page, PageHeader } from '@/components/kpi/PageHeader'
import { KPIGrid } from '@/components/kpi/KPITile'
import { Donut, FunnelBars, TrendArea } from '@/components/kpi/charts'
import { Badge, ChartCard, TableCard } from '@/components/kpi/ui'
import { CAMPAIGNS, LEADS_BY_SOURCE, LEADS_BY_SOURCE_OVER_TIME, MARKETING_FUNNEL } from '@/lib/kpi/data/mock'
import { COLORS, fmtCurrency, fmtNumber, fmtPercent } from '@/lib/kpi/format'

// ============================================================
// Marketing Department
// ============================================================

const TILES = [
  'cpl',
  'leads_total',
  'lead_to_audit',
  'audit_show_rate',
  'show_to_close',
  'revenue_per_lead',
  'ad_spend_mtd',
  'roas',
  'ctr',
  'landing_conv',
]

const CHANNEL_TONE: Record<string, 'brand' | 'success' | 'warning' | 'info' | 'neutral'> = {
  Meta: 'brand',
  Google: 'success',
  YouTube: 'warning',
  Referral: 'info',
  Email: 'neutral',
  TikTok: 'neutral',
  Organic: 'neutral',
}

export default function Marketing() {
  const totalLeads = LEADS_BY_SOURCE.reduce((s, d) => s + d.value, 0)
  const totalSpend = CAMPAIGNS.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0)

  return (
    <Page>
      <PageHeader
        eyebrow="Department"
        title="Marketing"
        description="Acquisition efficiency from impression to closed deal. CPL is above target for a third straight week — campaign-level detail is in the table below."
        icon={Megaphone}
        owner="Rosalind Achebe"
        action={
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Blended ROAS</p>
              <p className="num text-[15px] font-semibold text-gray-900">
                {(totalRevenue / totalSpend).toFixed(2)}x
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Campaigns</p>
              <p className="num text-[15px] font-semibold text-gray-900">{CAMPAIGNS.length}</p>
            </div>
          </div>
        }
      />

      <KPIGrid metricIds={TILES} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Leads by source"
          subtitle="Distribution for the selected period"
          source="HubSpot"
        >
          <Donut data={LEADS_BY_SOURCE} centerValue={fmtNumber(totalLeads)} centerLabel="Leads" />
        </ChartCard>

        <ChartCard
          title="Acquisition funnel"
          subtitle="Impression → closed won, with stage-over-stage conversion"
          source="CEG Brain"
        >
          <FunnelBars stages={MARKETING_FUNNEL} />
        </ChartCard>
      </div>

      <ChartCard
        title="Leads by source over time"
        subtitle="Monthly lead volume by channel — six months"
        source="Meta Ads"
        height="h-[300px]"
      >
        <TrendArea
          data={LEADS_BY_SOURCE_OVER_TIME}
          xKey="month"
          series={[
            { key: 'meta', name: 'Meta Ads', color: COLORS.brand600 },
            { key: 'google', name: 'Google Ads', color: COLORS.success },
            { key: 'organic', name: 'Organic', color: COLORS.brand400 },
            { key: 'referral', name: 'Referral', color: COLORS.warning },
            { key: 'youtube', name: 'YouTube', color: COLORS.brand200 },
          ]}
        />
      </ChartCard>

      <TableCard
        title="Campaign performance"
        subtitle="Ranked by spend. ROAS is calculated on booked revenue attributed within a 30-day window."
        source="Meta Ads"
      >
        <table className="ceg-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channel</th>
              <th className="text-right">Spend</th>
              <th className="text-right">Leads</th>
              <th className="text-right">CPL</th>
              <th className="text-right">Audits</th>
              <th className="text-right">Closes</th>
              <th className="text-right">Lead→Close</th>
              <th className="text-right">Revenue</th>
              <th className="text-right">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-gray-900 max-w-[240px] truncate" title={c.name}>
                  {c.name}
                </td>
                <td>
                  <Badge tone={CHANNEL_TONE[c.channel]}>{c.channel}</Badge>
                </td>
                <td className="num text-right">{fmtCurrency(c.spend)}</td>
                <td className="num text-right">{fmtNumber(c.leads)}</td>
                <td className="num text-right">
                  <span className={c.cpl > 45 ? 'text-red-600 font-semibold' : c.cpl > 38 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {fmtCurrency(c.cpl, { cents: true })}
                  </span>
                </td>
                <td className="num text-right">{c.audits}</td>
                <td className="num text-right">{c.closes}</td>
                <td className="num text-right text-gray-500">
                  {fmtPercent((c.closes / c.leads) * 100)}
                </td>
                <td className="num text-right font-semibold text-gray-900">{fmtCurrency(c.revenue)}</td>
                <td className="num text-right">
                  <Badge tone={c.roas >= 15 ? 'success' : c.roas >= 11 ? 'brand' : 'warning'}>
                    {c.roas.toFixed(1)}x
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-secondary">
              <td className="px-4 py-3 font-semibold text-gray-900 text-[13px]" colSpan={2}>
                Blended
              </td>
              <td className="num px-4 py-3 text-right font-semibold">{fmtCurrency(totalSpend)}</td>
              <td className="num px-4 py-3 text-right font-semibold">{fmtNumber(totalLeads)}</td>
              <td className="num px-4 py-3 text-right font-semibold">
                {fmtCurrency(totalSpend / totalLeads, { cents: true })}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">
                {CAMPAIGNS.reduce((s, c) => s + c.audits, 0)}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">
                {CAMPAIGNS.reduce((s, c) => s + c.closes, 0)}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">8.5%</td>
              <td className="num px-4 py-3 text-right font-semibold text-gray-900">
                {fmtCurrency(totalRevenue)}
              </td>
              <td className="num px-4 py-3 text-right font-semibold">
                {(totalRevenue / totalSpend).toFixed(1)}x
              </td>
            </tr>
          </tfoot>
        </table>
      </TableCard>
    </Page>
  )
}

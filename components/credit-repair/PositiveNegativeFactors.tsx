import { ThumbsUp, AlertTriangle } from 'lucide-react'

interface Factor {
  label: string
  detail: string
  impact: string
}

const impactBadge: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-gray-50 text-gray-700 border-gray-200',
}

const positiveImpact: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  medium: 'bg-brand-50 text-brand-700 border-brand-100',
  low: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function PositiveNegativeFactors({
  positive,
  negative,
}: {
  positive: Factor[]
  negative: Factor[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FactorCard
        title="Positive Factors"
        subtitle="Helping your scores"
        items={positive}
        icon={ThumbsUp}
        accentBg="bg-emerald-50"
        accentText="text-emerald-600"
        badgeMap={positiveImpact}
      />
      <FactorCard
        title="Negative Factors"
        subtitle="Hurting your scores"
        items={negative}
        icon={AlertTriangle}
        accentBg="bg-red-50"
        accentText="text-red-600"
        badgeMap={impactBadge}
      />
    </div>
  )
}

function FactorCard({
  title,
  subtitle,
  items,
  icon: Icon,
  accentBg,
  accentText,
  badgeMap,
}: {
  title: string
  subtitle: string
  items: Factor[]
  icon: typeof ThumbsUp
  accentBg: string
  accentText: string
  badgeMap: Record<string, string>
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-9 h-9 rounded-xl ${accentBg} ${accentText} flex items-center justify-center`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div>
          <div className="text-base font-bold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {items.map((f, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">{f.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{f.detail}</div>
            </div>
            <span
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${
                badgeMap[f.impact] || badgeMap['low']
              }`}
            >
              {f.impact}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

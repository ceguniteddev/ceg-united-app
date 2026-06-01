import { useMemo, useState } from 'react'
import { Search, ChevronDown, MoreHorizontal, Eye, Flag } from 'lucide-react'
import type { Bureau, NegativeItem, NegativeItemStatus, NegativeItemType } from '@/lib/credit-repair-types'
import { ItemTypeIcon, getTypeLabel } from './ItemTypeIcon'
import { BureauBadges } from './BureauBadges'

interface Props {
  items: NegativeItem[]
  selected: string[]
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
}

type TypeFilter = 'all' | NegativeItemType
type BureauFilter = 'all' | Bureau
type StatusFilter = 'all' | NegativeItemStatus

const STATUS_LABEL: Record<NegativeItemStatus, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
  'in-dispute': { label: 'In Dispute', tone: 'bg-brand-50 text-brand-700 border-brand-100' },
  verified: { label: 'Verified', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  updated: { label: 'Updated', tone: 'bg-violet-50 text-violet-700 border-violet-100' },
  deleted: { label: 'Deleted', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
}

const typeFilters: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'collection', label: 'Collections' },
  { key: 'charge-off', label: 'Charge-offs' },
  { key: 'late-payment', label: 'Late Payments' },
  { key: 'inquiry', label: 'Inquiries' },
  { key: 'public-record', label: 'Public Records' },
]

function fmtMoney(n: number): string {
  if (n === 0) return '—'
  return `$${n.toLocaleString('en-US')}`
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function NegativeItemsTable({ items, selected, onToggle, onSelectAll }: Props) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TypeFilter>('all')
  const [bureau, setBureau] = useState<BureauFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (type !== 'all' && i.type !== type) return false
      if (bureau !== 'all' && !i.bureaus.includes(bureau)) return false
      if (status !== 'all' && i.status !== status) return false
      if (query && !i.creditor.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [items, query, type, bureau, status])

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((i) => selected.includes(i.id))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Filters bar */}
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-base font-bold text-gray-900">Negative Items</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {filtered.length} of {items.length} items
              {selected.length > 0 && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[11px] font-semibold">
                  {selected.length} selected
                </span>
              )}
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by creditor name…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setType(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                type === f.key
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <SelectPill
              value={bureau}
              onChange={(v) => setBureau(v as BureauFilter)}
              options={[
                { value: 'all', label: 'All bureaus' },
                { value: 'experian', label: 'Experian' },
                { value: 'equifax', label: 'Equifax' },
                { value: 'transunion', label: 'TransUnion' },
              ]}
            />
            <SelectPill
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'new', label: 'New' },
                { value: 'in-dispute', label: 'In Dispute' },
                { value: 'updated', label: 'Updated' },
                { value: 'deleted', label: 'Deleted' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20"
                  checked={allVisibleSelected}
                  onChange={(e) =>
                    onSelectAll(
                      e.target.checked ? filtered.map((i) => i.id) : []
                    )
                  }
                  aria-label="Select all visible"
                />
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Creditor / Furnisher</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Account</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bureaus</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">Amount</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date Reported</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isSel = selected.includes(item.id)
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 last:border-0 transition-colors ${
                    isSel ? 'bg-brand-50/40' : 'hover:bg-gray-50/60'
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => onToggle(item.id)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20"
                      aria-label={`Select ${item.creditor}`}
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <ItemTypeIcon type={item.type} size="sm" />
                      <div className="text-xs font-medium text-gray-700 hidden xl:block">
                        {getTypeLabel(item.type)}
                        {item.latePaymentDays && (
                          <div className="text-[10px] text-gray-400">{item.latePaymentDays}-day</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-semibold text-gray-900 text-sm leading-tight">
                      {item.creditor}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="font-mono text-xs text-gray-600">
                      {item.accountNumber}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <BureauBadges reporting={item.bureaus} size="sm" />
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono text-sm text-gray-900 tabular-nums">
                    {fmtMoney(item.amount)}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-gray-600">
                    {fmtDate(item.dateReported)}
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${STATUS_LABEL[item.status].tone}`}
                    >
                      {STATUS_LABEL[item.status].label}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <RowMenu onMark={() => !isSel && onToggle(item.id)} />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <div className="text-sm text-gray-500">No items match the current filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {filtered.map((item) => {
          const isSel = selected.includes(item.id)
          return (
            <div
              key={item.id}
              className={`p-4 ${isSel ? 'bg-brand-50/40' : ''}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => onToggle(item.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20"
                />
                <ItemTypeIcon type={item.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{item.creditor}</div>
                      <div className="font-mono text-[11px] text-gray-500 mt-0.5">{item.accountNumber}</div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${STATUS_LABEL[item.status].tone} shrink-0`}
                    >
                      {STATUS_LABEL[item.status].label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <BureauBadges reporting={item.bureaus} size="sm" />
                    <div className="font-mono text-sm text-gray-900 tabular-nums">{fmtMoney(item.amount)}</div>
                  </div>
                  <div className="mt-1.5 text-[11px] text-gray-500">
                    {getTypeLabel(item.type)} · Reported {fmtDate(item.dateReported)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">No items match the current filters.</div>
        )}
      </div>
    </div>
  )
}

function SelectPill({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  )
}

function RowMenu({ onMark }: { onMark: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-card-hover border border-gray-100 py-1 z-10 animate-fade-in">
          <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> View Details
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              onMark()
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Flag className="w-3.5 h-3.5" /> Mark for Dispute
          </button>
        </div>
      )}
    </div>
  )
}

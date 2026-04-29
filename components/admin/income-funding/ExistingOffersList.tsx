import { Pencil, Trash2 } from 'lucide-react'
import type { DealOffer } from '@/lib/income-funding-types'
import { formatUSD } from '@/lib/underwriting'

interface ExistingOffersListProps {
  offers: DealOffer[]
  onDelete: (id: string) => void
  onEdit?: (offer: DealOffer) => void
}

export function ExistingOffersList({ offers, onDelete, onEdit }: ExistingOffersListProps) {
  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">
          No offers added yet. Use the form above to create the first offer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900">Existing offers ({offers.length})</h3>
      <ul className="space-y-2">
        {offers.map((o) => (
          <li
            key={o.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-center gap-3 flex-wrap"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                {o.dealType}
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {o.lenderName}
                </div>
                <div className="text-xs text-gray-500">
                  {formatUSD(o.fundingAmount)} · factor {o.factorRate.toFixed(2)} ·{' '}
                  {o.termLength} {o.termUnit}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(o)}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(o.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

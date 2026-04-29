import { Eye, Mail, Send, FileText, Building, Receipt, IdCard, Landmark } from 'lucide-react'
import { GradeBadge } from '@/components/income-funding/GradeBadge'
import { DealOfferForm } from './DealOfferForm'
import { ExistingOffersList } from './ExistingOffersList'
import type { AdminClient, DealOffer, DocumentRecord } from '@/lib/income-funding-types'
import { formatUSD } from '@/lib/underwriting'

interface ClientDetailProps {
  client: AdminClient
  onAddOffer: (offer: DealOffer) => void
  onDeleteOffer: (id: string) => void
  onNotify: () => void
}

const docIconMap = {
  ein: FileText,
  articles: Building,
  voidedCheck: Receipt,
  id: IdCard,
  bankStatements: Landmark,
}

function DocumentTile({ doc }: { doc: DocumentRecord }) {
  const Icon = docIconMap[doc.key]
  const isDone = doc.status === 'uploaded' || doc.status === 'synced'
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-3 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-900 truncate">{doc.title}</div>
        <div className="text-[11px] text-gray-500 truncate">
          {isDone ? doc.fileName || 'Provided' : 'Not uploaded'}
        </div>
      </div>
      {isDone && (
        <button
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
          title="View"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function ClientDetail({
  client,
  onAddOffer,
  onDeleteOffer,
  onNotify,
}: ClientDetailProps) {
  return (
    <div className="space-y-5">
      {/* Header / summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <GradeBadge grade={client.grade} size="lg" />
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </div>
              <div className="text-sm text-gray-500">{client.businessName}</div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  <span className="font-semibold text-gray-700">Monthly revenue:</span>{' '}
                  {formatUSD(client.monthlyRevenue)}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">Pre-approved:</span>{' '}
                  {formatUSD(client.preApprovedAmount)}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">Submitted:</span>{' '}
                  {client.submittedAt}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
            <button
              onClick={onNotify}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <Send className="w-3.5 h-3.5" />
              Notify Client
            </button>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Submitted Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {client.documents.map((d) => (
            <DocumentTile key={d.key} doc={d} />
          ))}
        </div>
      </div>

      {/* Offer form */}
      <DealOfferForm onSave={onAddOffer} />

      {/* Existing offers */}
      <ExistingOffersList offers={client.offers} onDelete={onDeleteOffer} />
    </div>
  )
}

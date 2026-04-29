import { ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import { DocumentUploadCard } from './DocumentUploadCard'
import type { DocumentRecord, IncomeFundingDeal } from '@/lib/income-funding-types'

interface DocumentCollectionViewProps {
  deal: IncomeFundingDeal
  onUpload: (key: DocumentRecord['key'], fileName: string, fileSize: string) => void
  onSubmit: () => void
}

export function DocumentCollectionView({
  deal,
  onUpload,
  onSubmit,
}: DocumentCollectionViewProps) {
  const requiredDocs = deal.documents.filter((d) => d.required)
  const allRequiredDone = requiredDocs.every(
    (d) => d.status === 'uploaded' || d.status === 'synced'
  )
  const totalDone = deal.documents.filter(
    (d) => d.status === 'uploaded' || d.status === 'synced'
  ).length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Upload required documents
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              We need a few more files to send your deal to underwriting. Drag and drop
              or click to upload.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Bank-level encryption
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>
              {totalDone} of {deal.documents.length} documents ready
            </span>
            <span className="font-semibold text-gray-700">
              {Math.round((totalDone / deal.documents.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
              style={{ width: `${(totalDone / deal.documents.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deal.documents.map((doc, i) => (
          <div
            key={doc.key}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
          >
            <DocumentUploadCard doc={doc} onUpload={onUpload} />
          </div>
        ))}
      </div>

      {/* Submit footer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6 flex items-center justify-between gap-4 flex-wrap animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-gray-400" />
          <p className="text-xs text-gray-500 max-w-md">
            By submitting, you confirm the uploaded documents are accurate. Your file
            is sent to a CEG underwriter for review.
          </p>
        </div>
        <button
          disabled={!allRequiredDone}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          Submit for Underwriting
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

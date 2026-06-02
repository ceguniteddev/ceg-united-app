import { ArrowRight, X, Flag } from 'lucide-react'

interface Props {
  count: number
  onClear: () => void
  onContinue: () => void
}

export function BulkActionBar({ count, onClear, onContinue }: Props) {
  if (count === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:left-[220px] pointer-events-none">
      <div className="px-4 sm:px-6 pb-4 pointer-events-none">
        <div className="max-w-[1400px] mx-auto pointer-events-auto animate-fade-in-up">
          <div className="bg-gray-900 text-white rounded-2xl shadow-card-hover px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div className="text-sm min-w-0">
              <div className="font-semibold whitespace-nowrap">
                {count} {count === 1 ? 'item' : 'items'} selected
              </div>
              <div className="text-[11px] text-gray-300 hidden sm:block">
                Ready to dispute across {count > 0 ? 'multiple bureaus' : ''}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
              <button
                onClick={onContinue}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">Continue to Dispute</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

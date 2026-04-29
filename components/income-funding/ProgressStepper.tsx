import { Check } from 'lucide-react'
import type { DealStatus } from '@/lib/income-funding-types'

interface ProgressStepperProps {
  status: DealStatus
}

// Logical 4 stages shown to the client. Internal substates collapse.
const stages: { key: DealStatus[]; label: string }[] = [
  { key: ['prequalified', 'collecting-documents'], label: 'Pre-Approved' },
  { key: ['under-review'], label: 'Submitted' },
  { key: ['offers-ready', 'accepting'], label: 'Offers Ready' },
  { key: ['complete'], label: 'Accepted' },
]

const order: DealStatus[] = [
  'prequalified',
  'collecting-documents',
  'under-review',
  'offers-ready',
  'accepting',
  'complete',
]

export function ProgressStepper({ status }: ProgressStepperProps) {
  const currentIdx = order.indexOf(status)

  return (
    <ol className="flex items-center w-full gap-2 sm:gap-4">
      {stages.map((stage, i) => {
        const stageStartIdx = order.indexOf(stage.key[0])
        const isActive = stage.key.includes(status)
        const isComplete = currentIdx > order.indexOf(stage.key[stage.key.length - 1])
        const isUpcoming = currentIdx < stageStartIdx

        return (
          <li key={stage.label} className="flex-1 flex items-center">
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <span
                className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${
                    isComplete
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
              >
                {isComplete ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`hidden sm:block text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  isActive
                    ? 'text-brand-700'
                    : isComplete
                    ? 'text-emerald-700'
                    : 'text-gray-400'
                }`}
              >
                {stage.label}
              </span>
              {i < stages.length - 1 && (
                <span
                  className={`flex-1 h-[2px] mx-1 sm:mx-2 rounded-full transition-colors ${
                    isComplete || isActive ? 'bg-brand-200' : 'bg-gray-100'
                  }`}
                />
              )}
            </div>
            {/* mobile labels under steps */}
            <span
              className={`sm:hidden absolute mt-9 text-[10px] font-medium ${
                isUpcoming ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {stage.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

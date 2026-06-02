import { useState } from 'react'
import { RotateCcw, X, Wrench } from 'lucide-react'
import type { RepairView } from '@/lib/credit-repair-types'

interface DemoToolbarProps {
  view: RepairView
  onSetView: (v: RepairView) => void
  onReset: () => void
}

const states: { key: RepairView; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'select-items', label: 'Select Items' },
  { key: 'choose-reasons', label: 'Choose Reasons' },
  { key: 'pick-agencies', label: 'Pick Agencies' },
  { key: 'generating', label: 'Generating' },
  { key: 'letters-ready', label: 'Letters Ready' },
  { key: 'attaching-documents', label: 'Attach Docs' },
  { key: 'mailing-options', label: 'Mailing Options' },
  { key: 'mailing-sent', label: 'Mailed' },
  { key: 'tracking', label: 'Tracking' },
]

export function DemoToolbar({ view, onSetView, onReset }: DemoToolbarProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 flex-wrap pl-14 md:pl-6">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-gray-300 shrink-0">
          <Wrench className="w-3.5 h-3.5" />
          Demo State
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {states.map((s) => (
            <button
              key={s.key}
              onClick={() => onSetView(s.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                view === s.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/5 text-gray-200 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
            title="Reset demo"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Dismiss demo toolbar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

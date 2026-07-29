"use client";
import { useState } from 'react'
import { RotateCcw, X, Wrench } from 'lucide-react'

// ============================================
// Demo toolbar — same dark strip pattern used by every
// other CEG module (credit repair, income funding).
// Drives a global "demo state" so reviewers can see the
// dashboard under healthy / strained / crisis conditions.
// ============================================

export type DemoState = 'healthy' | 'normal' | 'strained' | 'crisis'

const STATES: { key: DemoState; label: string }[] = [
  { key: 'healthy', label: 'Healthy' },
  { key: 'normal', label: 'Current' },
  { key: 'strained', label: 'Strained' },
  { key: 'crisis', label: 'Crisis' },
]

interface Props {
  state: DemoState
  onSetState: (s: DemoState) => void
  onReset: () => void
}

export function DemoToolbar({ state, onSetState, onReset }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs flex-shrink-0">
      <div className="max-w-shell mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 flex-wrap pl-14 lg:pl-6">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-gray-300 shrink-0">
          <Wrench className="w-3.5 h-3.5" />
          Demo State
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATES.map((s) => (
            <button
              key={s.key}
              onClick={() => onSetState(s.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                state === s.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/5 text-gray-200 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="hidden md:inline text-[11px] text-gray-400">
          Adjusts alert volume &amp; status thresholds across all pages
        </span>
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

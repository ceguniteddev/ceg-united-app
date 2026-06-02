import { useEffect, useState } from 'react'
import { Bot, Check, Loader2, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  bureauCount: number
  craCount: number
  onComplete: () => void
}

export function GeneratingLettersModal({ open, bureauCount, craCount, onComplete }: Props) {
  const steps = [
    'Compiling selected items',
    'Matching legal citations (FCRA §611, §623, §605B)',
    'Generating personalized letter for Experian',
    'Generating personalized letter for Equifax',
    'Generating personalized letter for TransUnion',
    `Generating letters for ${craCount || 0} third-party ${craCount === 1 ? 'agency' : 'agencies'}`,
    'Quality check + formatting',
  ].filter((label, idx) => {
    if (idx === 5 && craCount === 0) return false
    if (idx >= 2 && idx <= 4) {
      // Skip bureau steps for bureaus the user didn't pick.
      // We treat bureauCount as count of selected bureaus; show all 3 if all selected.
      return idx - 2 < bureauCount
    }
    return true
  })

  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (!open) {
      setCompleted(0)
      return
    }
    const interval = setInterval(() => {
      setCompleted((c) => {
        if (c >= steps.length) {
          clearInterval(interval)
          setTimeout(onComplete, 600)
          return c
        }
        return c + 1
      })
    }, 550)
    return () => clearInterval(interval)
  }, [open, steps.length, onComplete])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-card-hover p-6 sm:p-7 animate-scale-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-gray-900">AI is drafting your letters</h3>
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            </div>
            <div className="text-xs text-gray-500">Compiling FCRA-compliant disputes</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
            style={{
              width: `${Math.min(100, (completed / steps.length) * 100)}%`,
            }}
          />
        </div>

        {/* Steps */}
        <ul className="mt-5 space-y-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < completed
            const isActive = idx === completed
            return (
              <li
                key={step}
                className={`flex items-center gap-3 text-sm transition-opacity ${
                  isDone || isActive ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3 h-3" />
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : null}
                </span>
                <span className={isDone ? 'text-gray-700' : 'text-gray-900'}>
                  {step}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 text-[11px] text-gray-400 text-center">
          Each letter is personalized to the receiving agency and your selected items.
        </div>
      </div>
    </div>
  )
}

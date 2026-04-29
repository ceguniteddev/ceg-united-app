import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Eraser, FileSignature, ScrollText } from 'lucide-react'
import { OfferCard } from './OfferCard'
import { formatUSD } from '@/lib/underwriting'
import type { DealOffer } from '@/lib/income-funding-types'

interface AcceptanceViewProps {
  offer: DealOffer
  onBack: () => void
  onAccept: () => void
}

const FEE_PERCENTAGE = 0.05

export function AcceptanceView({ offer, onBack, onAccept }: AcceptanceViewProps) {
  const [agreed, setAgreed] = useState(false)
  const [mode, setMode] = useState<'type' | 'draw'>('type')
  const [typedSignature, setTypedSignature] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const fee = Math.round(offer.fundingAmount * FEE_PERCENTAGE)
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const hasSignature = mode === 'type' ? typedSignature.trim().length >= 2 : hasDrawn
  const canAccept = agreed && hasSignature

  // -------- canvas signature pad --------
  useEffect(() => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1e3a5f'
  }, [mode])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    canvasRef.current!.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const onPointerUp = () => {
    drawing.current = false
  }

  const clearSignature = () => {
    if (mode === 'type') {
      setTypedSignature('')
      return
    }
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setHasDrawn(false)
  }

  return (
    <div className="space-y-6">
      {/* Selected offer recap */}
      <div className="animate-fade-in-up">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Selected Offer
        </div>
        <OfferCard offer={offer} onSelect={() => {}} hideActions />
      </div>

      {/* Fee agreement */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              CEG Performance Success Fee Agreement
            </h2>
            <p className="text-xs text-gray-500">
              Please review and sign to accept this funding offer.
            </p>
          </div>
        </div>

        {/* Scrollable legal */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-44 overflow-y-auto custom-scrollbar text-xs leading-relaxed text-gray-600 space-y-2">
          <p>
            This Performance Success Fee Agreement ("Agreement") is entered into between
            the Client and Credit Experts Group LLC ("CEG") as of the date of execution.
          </p>
          <p>
            <span className="font-semibold text-gray-800">1. Success Fee.</span> Client
            agrees to pay CEG a success fee equal to <strong>5%</strong> of the gross
            funding amount approved and accepted through CEG's lender network.
          </p>
          <p>
            <span className="font-semibold text-gray-800">2. Payment.</span> The fee
            becomes due upon disbursement of funds from the lender to the Client and
            shall be paid via the same banking instrument used for funding receipt.
          </p>
          <p>
            <span className="font-semibold text-gray-800">3. Disclosure.</span> CEG is a
            consulting and brokerage firm and is not a lender. Final approval, terms,
            and disbursement are subject to the lender's underwriting standards.
          </p>
          <p>
            <span className="font-semibold text-gray-800">4. Termination.</span> This
            Agreement remains in effect for the duration of the active funding cycle.
          </p>
        </div>

        {/* Calculated fee callout */}
        <div className="mt-4 bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-4">
          <p className="text-sm text-gray-700">
            You agree to pay a success fee of{' '}
            <span className="font-bold text-brand-700">5%</span> based on the approved
            funding amount of{' '}
            <span className="font-bold text-gray-900 tabular-nums">
              {formatUSD(offer.fundingAmount)}
            </span>{' '}
            ={' '}
            <span className="font-extrabold text-brand-700 tabular-nums">
              {formatUSD(fee)}
            </span>{' '}
            fee.
          </p>
        </div>

        {/* Checkbox */}
        <label className="mt-5 flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I have read and agree to the{' '}
            <span className="font-semibold">CEG Fee Agreement</span> and{' '}
            <a className="text-brand-600 underline-offset-2 hover:underline" href="#">
              Terms of Service
            </a>
            .
          </span>
        </label>

        {/* Signature */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-brand-600" />
              E-Signature
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode('type')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  mode === 'type'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setMode('draw')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  mode === 'draw'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Draw
              </button>
            </div>
          </div>

          {mode === 'type' ? (
            <div className="relative">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full font-signature text-3xl text-brand-900 px-4 py-4 bg-white border-2 border-dashed border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 focus:bg-brand-50/30 transition"
              />
              <div className="absolute left-4 right-4 bottom-2 h-px bg-gray-200" />
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="w-full h-32 bg-white border-2 border-dashed border-gray-200 rounded-xl cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none">
                  Sign with your mouse or finger
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Date: {today}</span>
            <button
              onClick={clearSignature}
              className="inline-flex items-center gap-1 hover:text-gray-700 transition"
            >
              <Eraser className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex items-center justify-between gap-3 flex-wrap animate-fade-in-up stagger-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to offers
        </button>
        <button
          disabled={!canAccept}
          onClick={onAccept}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          Accept offer & continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

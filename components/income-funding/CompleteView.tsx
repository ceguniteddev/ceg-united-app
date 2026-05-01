import { Check, FileText, FileSignature, Banknote, ArrowRight, Mail } from 'lucide-react'
import { OfferCard } from './OfferCard'
import { formatUSD } from '@/lib/underwriting'
import type { DealOffer, IncomeFundingDeal } from '@/lib/income-funding-types'

interface CompleteViewProps {
  deal: IncomeFundingDeal
  offer: DealOffer
  onReturn: () => void
}

const FEE_PERCENTAGE = 0.05

const nextSteps = [
  {
    icon: FileText,
    title: 'Lender sends contracts',
    desc: 'Expect final loan documents in your email within 24 hours.',
    eta: '24 h',
  },
  {
    icon: FileSignature,
    title: 'Sign final documents',
    desc: "E-sign the lender's funding agreement once it arrives.",
    eta: '1–2 days',
  },
  {
    icon: Banknote,
    title: 'Funds wired to your account',
    desc: 'Lender wires funds to the bank account on your voided check.',
    eta: '1–3 business days',
  },
]

export function CompleteView({ deal: _deal, offer, onReturn }: CompleteViewProps) {
  const fee = Math.round(offer.fundingAmount * FEE_PERCENTAGE)

  return (
    <div className="space-y-6">
      {/* Hero confirmation */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-card p-8 md:p-10 text-center animate-fade-in-up">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="checkmark-pop mx-auto w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>

          <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">
            Your deal has been submitted
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-500 max-w-md mx-auto">
            Please check your email for final contracts from{' '}
            <span className="font-semibold text-gray-700">{offer.lenderName}</span>.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-amber" />
            Pending final approval
          </div>
        </div>
      </div>

      {/* Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-1">
        <div className="lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Accepted offer
          </div>
          <OfferCard offer={offer} onSelect={() => {}} hideActions />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex flex-col">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            CEG success fee due
          </div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900 tabular-nums">
            {formatUSD(fee)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            5% of {formatUSD(offer.fundingAmount)} funding
          </div>
          <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed">
            Fee is collected automatically at the time of disbursement from your
            funding bank account.
          </div>
          <a
            href={`mailto:${offer.lenderName}`}
            className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <Mail className="w-3.5 h-3.5" />
            Email a copy of this agreement
          </a>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up stagger-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">
          What's next
        </h2>
        <ol className="space-y-3">
          {nextSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={step.title}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-sm text-gray-900">
                      {step.title}
                    </span>
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {step.eta}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={onReturn}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition"
        >
          Return to dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

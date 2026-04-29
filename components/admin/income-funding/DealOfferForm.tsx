import { useEffect, useMemo, useState } from 'react'
import { Plus, Save } from 'lucide-react'
import type {
  ApprovalLikelihood,
  DealOffer,
  DealType,
  PaymentFrequency,
  TermUnit,
} from '@/lib/income-funding-types'
import { factorRateOf } from '@/lib/underwriting'

interface DealOfferFormProps {
  onSave: (offer: DealOffer) => void
}

const DEAL_TYPES: DealType[] = ['MCA', 'LOC', 'Revenue-Based', 'Term Loan', 'Equipment Finance']
const TERM_UNITS: TermUnit[] = ['days', 'weeks', 'months']
const FREQS: PaymentFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly']
const LIKELIHOOD: ApprovalLikelihood[] = ['most-likely', 'likely', 'possible']

const labelize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')

export function DealOfferForm({ onSave }: DealOfferFormProps) {
  const [dealType, setDealType] = useState<DealType>('MCA')
  const [lenderName, setLenderName] = useState('')
  const [fundingAmount, setFundingAmount] = useState<number>(0)
  const [paybackAmount, setPaybackAmount] = useState<number>(0)
  const [termLength, setTermLength] = useState<number>(0)
  const [termUnit, setTermUnit] = useState<TermUnit>('months')
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('daily')
  const [estimatedPayment, setEstimatedPayment] = useState<number>(0)
  const [approvalLikelihood, setApprovalLikelihood] = useState<ApprovalLikelihood>('likely')
  const [notes, setNotes] = useState('')

  const factorRate = useMemo(
    () => factorRateOf(fundingAmount, paybackAmount),
    [fundingAmount, paybackAmount]
  )

  // auto-calc estimated payment when relevant fields change & user hasn't manually edited
  useEffect(() => {
    if (!fundingAmount || !paybackAmount || !termLength) return
    let totalPayments = termLength
    if (termUnit === 'months') {
      if (paymentFrequency === 'daily') totalPayments = termLength * 22
      if (paymentFrequency === 'weekly') totalPayments = termLength * 4
      if (paymentFrequency === 'biweekly') totalPayments = termLength * 2
    }
    if (termUnit === 'weeks') {
      if (paymentFrequency === 'daily') totalPayments = termLength * 5
      if (paymentFrequency === 'biweekly') totalPayments = Math.ceil(termLength / 2)
      if (paymentFrequency === 'monthly') totalPayments = Math.max(1, Math.floor(termLength / 4))
    }
    if (totalPayments > 0) {
      setEstimatedPayment(Math.round(paybackAmount / totalPayments))
    }
  }, [fundingAmount, paybackAmount, termLength, termUnit, paymentFrequency])

  const canSave = lenderName && fundingAmount > 0 && paybackAmount > 0 && termLength > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      id: `offer_${Date.now()}`,
      dealType,
      lenderName,
      fundingAmount,
      paybackAmount,
      factorRate,
      termLength,
      termUnit,
      paymentFrequency,
      estimatedPayment,
      notes,
      approvalLikelihood,
      createdAt: new Date().toISOString(),
    })

    // reset
    setLenderName('')
    setFundingAmount(0)
    setPaybackAmount(0)
    setTermLength(0)
    setEstimatedPayment(0)
    setNotes('')
  }

  const inputCls =
    'w-full h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Plus className="w-[18px] h-[18px]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Add new deal offer</h3>
          <p className="text-xs text-gray-500">
            Create an offer to send to the client.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Deal type */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Deal type
          </span>
          <select
            value={dealType}
            onChange={(e) => setDealType(e.target.value as DealType)}
            className={inputCls}
          >
            {DEAL_TYPES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>

        {/* Lender */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Lender name
          </span>
          <input
            value={lenderName}
            onChange={(e) => setLenderName(e.target.value)}
            placeholder="e.g. Rapid Capital"
            className={inputCls}
          />
        </label>

        {/* Funding */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Funding amount ($)
          </span>
          <input
            type="number"
            value={fundingAmount || ''}
            onChange={(e) => setFundingAmount(Number(e.target.value))}
            className={inputCls}
          />
        </label>

        {/* Payback */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Payback amount ($)
          </span>
          <input
            type="number"
            value={paybackAmount || ''}
            onChange={(e) => setPaybackAmount(Number(e.target.value))}
            className={inputCls}
          />
        </label>

        {/* Factor (auto) */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Factor rate (auto)
          </span>
          <input
            value={factorRate ? factorRate.toFixed(2) : ''}
            readOnly
            placeholder="—"
            className={`${inputCls} bg-gray-50 font-mono text-gray-700`}
          />
        </label>

        {/* Term + unit */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Term length
            </span>
            <input
              type="number"
              value={termLength || ''}
              onChange={(e) => setTermLength(Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Unit
            </span>
            <select
              value={termUnit}
              onChange={(e) => setTermUnit(e.target.value as TermUnit)}
              className={inputCls}
            >
              {TERM_UNITS.map((u) => (
                <option key={u} value={u}>
                  {labelize(u)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Frequency */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Payment frequency
          </span>
          <select
            value={paymentFrequency}
            onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
            className={inputCls}
          >
            {FREQS.map((f) => (
              <option key={f} value={f}>
                {labelize(f)}
              </option>
            ))}
          </select>
        </label>

        {/* Estimated payment */}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Estimated payment ($)
          </span>
          <input
            type="number"
            value={estimatedPayment || ''}
            onChange={(e) => setEstimatedPayment(Number(e.target.value))}
            className={inputCls}
          />
        </label>

        {/* Likelihood */}
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Approval likelihood
          </span>
          <div className="mt-1 flex gap-2">
            {LIKELIHOOD.map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setApprovalLikelihood(l)}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                  approvalLikelihood === l
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {labelize(l)}
              </button>
            ))}
          </div>
        </label>

        {/* Notes */}
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Notes / stips / conditions
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Requires 4 months bank statements verified."
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition resize-none"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          disabled={!canSave}
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition"
        >
          <Save className="w-4 h-4" />
          Save offer
        </button>
      </div>
    </div>
  )
}

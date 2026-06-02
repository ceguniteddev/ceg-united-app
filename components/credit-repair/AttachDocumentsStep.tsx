import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  Sparkles,
  Lock,
  FileCheck2,
  Mail,
  Info,
  Check,
  ArrowRight,
  Layers,
} from 'lucide-react'
import {
  formatFileSize,
  MOCK_USER_DOCUMENTS,
  OPTIONAL_SUPPORTING_DOCS,
  REQUIRED_IDENTITY_DOCS,
} from '@/lib/myDocuments'
import { DocumentLibraryPicker } from './DocumentLibraryPicker'

// ============================================
// AttachDocumentsStep — Step A of Mail Letter flow
// ============================================
// Three sections + privacy notice + sticky sidebar summary.
// Step is "complete" when the user has attached at minimum a Driver's
// License (or equivalent ID) AND a Proof of Address.

export interface AttachDocumentsResult {
  /** required identity template ids that are checked */
  requiredIds: string[]
  /** optional template ids that are checked */
  optionalIds: string[]
  /** user library document ids that are attached */
  libraryIds: string[]
  /** true once user confirms SSN-redaction notice */
  redactionConfirmed: boolean
}

interface Props {
  /** Display name for "Mailing to" sidebar (e.g. "Experian" or "All 4 agencies") */
  recipientLabel: string
  /** Sub-recipient line (e.g. "P.O. Box 4500, Allen TX") */
  recipientSubLabel?: string
  /** Number of letters this attachment will go on (1 for single, N for bulk) */
  letterCount: number
  /** Reasons across all selected items — used to auto-recommend optional docs */
  reasonCodes: string[]
  /** Initial selection (used when re-entering the step) */
  initial?: AttachDocumentsResult
  onBack: () => void
  onContinue: (result: AttachDocumentsResult) => void
}

export function AttachDocumentsStep({
  recipientLabel,
  recipientSubLabel,
  letterCount,
  reasonCodes,
  initial,
  onBack,
  onContinue,
}: Props) {
  // ---- state ----
  const [requiredIds, setRequiredIds] = useState<string[]>(
    initial?.requiredIds ?? REQUIRED_IDENTITY_DOCS.map((d) => d.id)
  )

  const initialOptional = useMemo(() => {
    if (initial?.optionalIds) return initial.optionalIds
    // Auto-recommend optional docs whose reason matches any selected reason.
    return OPTIONAL_SUPPORTING_DOCS.filter(
      (d) => d.autoRecommendForReason && reasonCodes.includes(d.autoRecommendForReason)
    ).map((d) => d.id)
  }, [initial, reasonCodes])

  const [optionalIds, setOptionalIds] = useState<string[]>(initialOptional)
  const [libraryIds, setLibraryIds] = useState<string[]>(initial?.libraryIds ?? [])
  const [redactionConfirmed, setRedactionConfirmed] = useState(
    initial?.redactionConfirmed ?? false
  )

  // ---- toggles ----
  const toggle = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  // ---- summary maths ----
  const summary = useMemo(() => {
    const reqDocs = REQUIRED_IDENTITY_DOCS.filter((d) => requiredIds.includes(d.id))
    const optDocs = OPTIONAL_SUPPORTING_DOCS.filter((d) => optionalIds.includes(d.id))
    const libDocs = MOCK_USER_DOCUMENTS.filter((d) => libraryIds.includes(d.id))
    const totalCount = reqDocs.length + optDocs.length + libDocs.length
    const totalBytes =
      reqDocs.reduce((s, d) => s + d.estimatedSizeBytes, 0) +
      optDocs.reduce((s, d) => s + d.estimatedSizeBytes, 0) +
      libDocs.reduce((s, d) => s + d.sizeBytes, 0)
    const pages = 1 + totalCount // 1 page letter + ~1 page per attachment (avg)
    const postageClass =
      pages <= 5 ? 'USPS First-Class (1 oz)' : `USPS First-Class (${Math.ceil(pages / 5)} oz)`
    return { totalCount, totalBytes, pages, postageClass }
  }, [requiredIds, optionalIds, libraryIds])

  // Continue gate: must have DL + POA + redaction confirmed.
  const hasDL = requiredIds.includes('req-dl')
  const hasPOA = requiredIds.includes('req-poa')
  const canContinue = hasDL && hasPOA && redactionConfirmed

  // Scroll to top whenever this step mounts (when reached via demo toolbar)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-5">
        {/* Heading */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Mail Letter — Step 1 of 3
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">
            Attach Supporting Documents
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Most credit disputes require proof of identity and address. Select what to mail with your letter.
          </p>
        </div>

        {/* Required Identity Documents */}
        <Section
          icon={<ShieldCheck className="w-4 h-4" />}
          iconTone="brand"
          title="Required Identity Documents"
          subtitle="Bureaus reject disputes without these. Recommended on by default."
        >
          <div className="space-y-2">
            {REQUIRED_IDENTITY_DOCS.map((doc) => (
              <DocCheckRow
                key={doc.id}
                checked={requiredIds.includes(doc.id)}
                onToggle={() => toggle(doc.id, requiredIds, setRequiredIds)}
                label={doc.label}
                description={doc.description}
                sizeBytes={doc.estimatedSizeBytes}
                badge="Recommended"
              />
            ))}
          </div>
        </Section>

        {/* Optional Supporting Documents */}
        <Section
          icon={<Sparkles className="w-4 h-4" />}
          iconTone="violet"
          title="Optional Supporting Documents"
          subtitle="Add proof that strengthens specific dispute reasons."
        >
          <div className="space-y-2">
            {OPTIONAL_SUPPORTING_DOCS.map((doc) => {
              const autoRec =
                doc.autoRecommendForReason &&
                reasonCodes.includes(doc.autoRecommendForReason)
              return (
                <DocCheckRow
                  key={doc.id}
                  checked={optionalIds.includes(doc.id)}
                  onToggle={() => toggle(doc.id, optionalIds, setOptionalIds)}
                  label={doc.label}
                  description={doc.description}
                  sizeBytes={doc.estimatedSizeBytes}
                  badge={autoRec ? 'Auto-suggested' : undefined}
                  badgeTone={autoRec ? 'amber' : undefined}
                />
              )
            })}
          </div>
        </Section>

        {/* From My Documents Library */}
        <Section
          icon={<Layers className="w-4 h-4" />}
          iconTone="emerald"
          title="From My Documents Library"
          subtitle="Files you’ve already uploaded to CEG — reuse them on this dispute."
        >
          <DocumentLibraryPicker
            selectedIds={libraryIds}
            onToggle={(id) => toggle(id, libraryIds, setLibraryIds)}
          />
        </Section>

        {/* Privacy notice */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                Privacy &amp; SSN Protection
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                We recommend redacting all but the last 4 digits of your SSN on any documents containing it.
                CEG never stores your full SSN.
              </p>
              <label className="mt-3 inline-flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={redactionConfirmed}
                  onChange={(e) => setRedactionConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-gray-800">
                  I have redacted sensitive information where appropriate
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Mobile sticky bottom bar substitute (back/continue) */}
        <div className="lg:hidden flex items-center gap-2 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            Back
          </button>
          <button
            disabled={!canContinue}
            onClick={() =>
              onContinue({ requiredIds, optionalIds, libraryIds, redactionConfirmed })
            }
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${
              canContinue ? 'bg-brand-600 hover:bg-brand-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Mailing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sidebar summary (desktop) */}
      <div className="hidden lg:block">
        <div className="sticky top-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
              Mailing summary
            </div>
            <div className="mt-2 space-y-3">
              <SummaryRow icon={<Mail className="w-4 h-4" />} label="Mailing to">
                <div className="text-sm font-semibold text-gray-900">{recipientLabel}</div>
                {recipientSubLabel && (
                  <div className="text-[11px] text-gray-500 mt-0.5">{recipientSubLabel}</div>
                )}
              </SummaryRow>
              <SummaryRow icon={<FileCheck2 className="w-4 h-4" />} label="Letter">
                <div className="text-sm text-gray-700">
                  {letterCount === 1 ? '1 page' : `${letterCount} letters × 1 page`}
                </div>
              </SummaryRow>
              <SummaryRow icon={<Layers className="w-4 h-4" />} label="Attachments">
                <div className="text-sm text-gray-700">
                  {summary.totalCount} document{summary.totalCount === 1 ? '' : 's'}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {formatFileSize(summary.totalBytes)} total
                </div>
              </SummaryRow>
              <div className="pt-3 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Estimated weight</span>
                  <span className="font-mono tabular-nums text-gray-900">
                    {Math.max(1, Math.ceil(summary.pages / 5))} oz
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Postage class</span>
                  <span className="text-gray-900 font-medium">{summary.postageClass}</span>
                </div>
              </div>
            </div>

            {/* Continue CTA */}
            <button
              disabled={!canContinue}
              onClick={() =>
                onContinue({ requiredIds, optionalIds, libraryIds, redactionConfirmed })
              }
              className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${
                canContinue
                  ? 'bg-brand-600 hover:bg-brand-700 shadow-sm'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Continue to Mailing
              <ArrowRight className="w-4 h-4" />
            </button>
            {!canContinue && (
              <div className="mt-2 text-[11px] text-gray-500 leading-relaxed flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  Driver’s License + Proof of Address are required, plus the redaction
                  confirmation.
                </span>
              </div>
            )}
            <button
              onClick={onBack}
              className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 py-1.5 transition-colors"
            >
              Back to letters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- subcomponents ----------

function Section({
  icon,
  iconTone,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  iconTone: 'brand' | 'violet' | 'emerald'
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const toneClass =
    iconTone === 'brand'
      ? 'bg-brand-50 text-brand-700'
      : iconTone === 'violet'
        ? 'bg-violet-50 text-violet-700'
        : 'bg-emerald-50 text-emerald-700'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneClass}`}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">{title}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function DocCheckRow({
  checked,
  onToggle,
  label,
  description,
  sizeBytes,
  badge,
  badgeTone = 'brand',
}: {
  checked: boolean
  onToggle: () => void
  label: string
  description: string
  sizeBytes: number
  badge?: string
  badgeTone?: 'brand' | 'amber'
}) {
  const badgeClass =
    badgeTone === 'amber'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-brand-50 text-brand-700 border-brand-100'
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-xl border p-3 transition-all flex items-start gap-3 ${
        checked
          ? 'border-brand-500 bg-brand-50/40 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked
            ? 'bg-brand-600 border-brand-600 text-white'
            : 'border-gray-300 bg-white'
        }`}
      >
        {checked && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          {badge && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
          {description}
        </div>
      </div>
      <div className="text-[11px] font-mono tabular-nums text-gray-400 shrink-0">
        ~{formatFileSize(sizeBytes)}
      </div>
    </button>
  )
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}

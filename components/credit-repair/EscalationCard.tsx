import { ArrowUpRight, Scale, Megaphone, FileSearch } from 'lucide-react'
import type { TrackingRow } from './DisputeTrackingTable'

interface Props {
  rows: TrackingRow[]
  onSendMOV: (row: TrackingRow) => void
  onCFPB: (row: TrackingRow) => void
}

export function EscalationCard({ rows, onSendMOV, onCFPB }: Props) {
  const verified = rows.filter((r) => r.status === 'verified')
  if (verified.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-card p-5 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base font-bold text-gray-900">
              {verified.length} {verified.length === 1 ? 'item came back' : 'items came back'} as &ldquo;Verified&rdquo;
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Round 2 ready
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            That doesn&rsquo;t mean the items are accurate — it means the bureau ran a re-investigation and the furnisher confirmed via e-OSCAR. You have escalation paths.
          </p>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <ActionTile
              icon={FileSearch}
              title="Method of Verification"
              detail="Demand the procedure used (FCRA §611(a)(7)). Often forces deletion."
              onClick={() => onSendMOV(verified[0])}
              tone="brand"
            />
            <ActionTile
              icon={Scale}
              title="§611(a)(7) Procedure Demand"
              detail="Force documentation of who, what, when of the verification."
              onClick={() => onSendMOV(verified[0])}
              tone="brand"
            />
            <ActionTile
              icon={Megaphone}
              title="Escalate to CFPB"
              detail="File a CFPB complaint for failure to comply with FCRA."
              onClick={() => onCFPB(verified[0])}
              tone="amber"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionTile({
  icon: Icon,
  title,
  detail,
  onClick,
  tone,
}: {
  icon: typeof Scale
  title: string
  detail: string
  onClick: () => void
  tone: 'brand' | 'amber'
}) {
  const colors =
    tone === 'brand'
      ? 'bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100'
      : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-colors ${colors}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="text-[11px] text-current opacity-80 mt-1">{detail}</div>
    </button>
  )
}

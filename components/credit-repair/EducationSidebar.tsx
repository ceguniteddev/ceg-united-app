import { Scale, Clock, ShieldCheck, ExternalLink } from 'lucide-react'

export function EducationSidebar() {
  return (
    <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl border border-brand-100 shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
          <Scale className="w-[18px] h-[18px]" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            Know your rights
          </div>
          <div className="text-sm font-bold text-gray-900">Fair Credit Reporting Act</div>
        </div>
      </div>

      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-gray-900">You can dispute under §611</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Any inaccurate, incomplete, or unverifiable item must be investigated.
            </div>
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-gray-900">Bureaus must respond in 30 days</div>
            <div className="text-xs text-gray-600 mt-0.5">
              45 days if you provide additional information after the initial dispute.
            </div>
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-gray-900">Unverifiable items must be deleted</div>
            <div className="text-xs text-gray-600 mt-0.5">
              If the furnisher cannot document accuracy, the bureau must remove the item.
            </div>
          </div>
        </li>
      </ul>

      <a
        href="https://www.consumer.ftc.gov/articles/0151-disputing-errors-credit-reports"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
      >
        Learn more about your rights
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

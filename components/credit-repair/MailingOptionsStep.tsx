import { useEffect, useState } from "react";
import {
  Check,
  ShieldCheck,
  Mail,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  MAILING_METHODS,
  getMailingMethods,
  type MailingMethod,
} from "@/lib/credit-repair/lobMailing";
import { useFeeSettings } from "@/hooks/fee-settings";

// ============================================
// MailingOptionsStep — Step B
// ============================================
// Three radio cards \u2192 order summary \u2192 final CTA. The mailing button
// triggers a Promise that the parent resolves with a LobMailResponse.

interface Props {
  /** Display name for the recipient summary (single agency or "All bureaus") */
  recipientLabel: string;
  recipientAddress?: string;
  /** Number of letters this batch will produce */
  letterCount: number;
  /** Total page count = letters + attachments */
  totalPages: number;
  /** Initial mailing method (default 'certified') */
  initialMethod?: MailingMethod;
  onBack: () => void;
  onConfirm: (method: MailingMethod) => Promise<void>;
}

export function MailingOptionsStep({
  recipientLabel,
  recipientAddress,
  letterCount,
  totalPages,
  initialMethod = "certified",
  onBack,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<MailingMethod>(initialMethod);
  const [submitting, setSubmitting] = useState(false);
  const { data: feeSettings } = useFeeSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const mailingMethods = feeSettings
    ? getMailingMethods(feeSettings)
    : MAILING_METHODS;
  const cfg = mailingMethods[method];
  const subtotal = cfg.price * letterCount;
  // Lob is invoice-billed so we just show subtotal == total — no tax in demo.
  const total = subtotal;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onConfirm(method);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Mail Letter — Step 2 of 3
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">
            Choose Mailing Method
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Certified Mail is the gold standard for FCRA disputes — it gives you
            a tracking number you can attach to a complaint if a bureau ignores
            you.
          </p>
        </div>

        <div className="space-y-3">
          {(Object.keys(mailingMethods) as MailingMethod[]).map((key) => {
            const opt = mailingMethods[key];
            const isActive = method === key;
            return (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`w-full text-left rounded-2xl border p-4 transition-all flex items-start gap-3 ${
                  isActive
                    ? "border-brand-500 bg-brand-50/40 shadow-sm ring-1 ring-brand-100"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "border-brand-600 bg-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isActive && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-bold text-gray-900">
                      {opt.label}
                    </div>
                    {opt.recommended && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {opt.deliveryWindow}
                  </div>
                  <div className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    {opt.description}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono tabular-nums text-gray-900">
                    ${opt.price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    per letter
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile-only inline summary + CTA */}
        <div className="lg:hidden space-y-3">
          <OrderSummaryCard
            recipientLabel={recipientLabel}
            recipientAddress={recipientAddress}
            letterCount={letterCount}
            totalPages={totalPages}
            method={method}
            subtotal={subtotal}
            total={total}
          />
          <SubmitCTA
            total={total}
            submitting={submitting}
            onSubmit={handleSubmit}
            onBack={onBack}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-4 space-y-3">
          <OrderSummaryCard
            recipientLabel={recipientLabel}
            recipientAddress={recipientAddress}
            letterCount={letterCount}
            totalPages={totalPages}
            method={method}
            subtotal={subtotal}
            total={total}
          />
          <SubmitCTA
            total={total}
            submitting={submitting}
            onSubmit={handleSubmit}
            onBack={onBack}
          />
        </div>
      </div>
    </div>
  );
}

function OrderSummaryCard({
  recipientLabel,
  recipientAddress,
  letterCount,
  totalPages,
  method,
  subtotal,
  total,
}: {
  recipientLabel: string;
  recipientAddress?: string;
  letterCount: number;
  totalPages: number;
  method: MailingMethod;
  subtotal: number;
  total: number;
}) {
  const { data: feeSettings } = useFeeSettings();
  const mailingMethods = feeSettings
    ? getMailingMethods(feeSettings)
    : MAILING_METHODS;
  const cfg = mailingMethods[method];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
        Order summary
      </div>

      <div className="mt-3 space-y-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Letter to
            </div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">
              {recipientLabel}
            </div>
            {recipientAddress && (
              <div className="text-[11px] text-gray-500 mt-0.5">
                {recipientAddress}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-3 border-t border-gray-100">
          <SummaryLine label="Letters" value={String(letterCount)} />
          <SummaryLine label="Total pages" value={String(totalPages)} />
          <SummaryLine label="Method" value={cfg.label} />
          <SummaryLine
            label={`Subtotal (${letterCount} × $${cfg.price.toFixed(2)})`}
            value={`$${subtotal.toFixed(2)}`}
          />
        </div>
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">Total</div>
          <div className="text-base font-bold font-mono tabular-nums text-gray-900">
            ${total.toFixed(2)}
          </div>
        </div>
      </div>

      {/* USPS verification badge */}
      {/* <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-700">
        <ShieldCheck className="w-3 h-3" />
        Address verified by USPS
      </div> */}
    </div>
  );
}

function SubmitCTA({
  total,
  submitting,
  onSubmit,
  onBack,
}: {
  total: number;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <button
        disabled={submitting}
        onClick={onSubmit}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-bold transition-colors shadow-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Mail Letter — ${total.toFixed(2)}
          </>
        )}
      </button>
      <div className="text-[10px] text-gray-500 text-center mt-2.5 leading-relaxed">
        By clicking, you authorize CEG to mail this letter.
      </div>
      <button
        onClick={onBack}
        disabled={submitting}
        className="mt-2 w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono tabular-nums text-gray-900">{value}</span>
    </div>
  );
}

function LobLogo() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M7 8h2v8H7zM12 11a3 3 0 110 6 3 3 0 010-6zm0 1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
        fill="currentColor"
      />
    </svg>
  );
}

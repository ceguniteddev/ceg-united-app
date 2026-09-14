import {
  Building2,
  Download,
  Eye,
  Send,
  Check,
  ExternalLink,
  Pencil,
} from "lucide-react";
import type { GeneratedLetter } from "@/lib/credit-repair/credit-repair-types";
import { downloadLetterPdf } from "@/lib/pdfGenerator";
import { uspsTrackingUrl } from "@/lib/credit-repair/lobMailing";

interface Props {
  letter: GeneratedLetter;
  itemCount: number;
  isBureau: boolean;
  onPreview: () => void;
  /** Open the Mail Letter (Lob.com) flow for this letter */
  onMail: () => void;
}

export function LetterCard({
  letter,
  itemCount,
  isBureau,
  onPreview,
  onMail,
}: Props) {
  const isMailed = !!letter.mailedAt;
  const isSent = !!letter.sentAt && !isMailed;
  const previewLines = letter.content.split("\n").slice(0, 6).join("\n");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden card-hover">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
            isBureau
              ? "bg-brand-50 text-brand-700"
              : "bg-violet-50 text-violet-700"
          }`}
        >
          {isBureau ? letter.agencyName[0] : <Building2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {letter.agencyName}
            </div>
            {isMailed && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-700">
                <Check className="w-3 h-3" /> Mailed
              </span>
            )}
            {isSent && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-700">
                <Check className="w-3 h-3" /> Sent
              </span>
            )}
            {letter.isEdited && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-[10px] font-semibold text-amber-700">
                <Pencil className="w-2.5 h-2.5" /> Edited
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {isBureau ? "Credit Bureau" : "Specialty CRA"} · {itemCount}{" "}
            {itemCount === 1 ? "item" : "items"}
          </div>
        </div>
      </div>

      {/* Letter preview OR mailed-tracking summary */}
      {isMailed ? (
        <div className="mx-5 mt-4 px-3 py-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            USPS Tracking
          </div>
          <div className="font-mono text-[11.5px] text-gray-900 mt-0.5 tabular-nums break-all">
            {letter.trackingNumber}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {letter.expectedDelivery
              ? `ETA ${new Date(letter.expectedDelivery).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  },
                )}`
              : ""}
            {letter.mailedFrom ? ` · mailed from ${letter.mailedFrom}` : ""}
          </div>
        </div>
      ) : (
        <div className="mx-5 mt-4 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
          <pre className="font-mono text-[10.5px] leading-relaxed text-gray-700 line-clamp-6 whitespace-pre-wrap">
            {previewLines}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pt-4 pb-5">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onPreview}
            className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => downloadLetterPdf({ letter })}
            className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isMailed
                ? "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          {isMailed && letter.trackingNumber ? (
            <a
              href={uspsTrackingUrl(letter.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Track
            </a>
          ) : (
            <button
              onClick={onMail}
              className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Mail
            </button>
          )}
        </div>

        {isMailed && (
          <div className="mt-2.5 text-[11px] text-center text-gray-500">
            Lob ID <span className="font-mono">{letter.lobId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

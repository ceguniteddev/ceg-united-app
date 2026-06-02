import { X, Download, Send } from "lucide-react";
import type { GeneratedLetter } from "@/lib/credit-repair/credit-repair-types";
import { downloadLetterPdf } from "@/lib/pdfGenerator";

interface Props {
  letter: GeneratedLetter | null;
  onClose: () => void;
}

export function LetterPreviewModal({ letter, onClose }: Props) {
  if (!letter) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-card-hover max-h-[92vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
              Dispute Letter
            </div>
            <div className="text-base font-bold text-gray-900">
              {letter.agencyName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadLetterPdf({ letter })}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 px-5 sm:px-8 py-6">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-10">
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-gray-800">
              {letter.content}
            </pre>
          </div>
        </div>

        {/* Footer (mobile actions) */}
        <div className="sm:hidden px-5 py-3 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={() => downloadLetterPdf({ letter })}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
            <Send className="w-3.5 h-3.5" />
            Mail via CEG
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { X, Download, Send, Pencil, Save, RotateCcw } from "lucide-react";
import type { GeneratedLetter } from "@/lib/credit-repair/credit-repair-types";
import { downloadLetterPdf } from "@/lib/pdfGenerator";

interface Props {
  letter: GeneratedLetter | null;
  onClose: () => void;
  /**
   * Persist edits to the letter body. When omitted the modal stays read-only
   * (e.g. for already-mailed letters that must not change).
   */
  onSave?: (agencyKey: string, content: string) => void;
}

export function LetterPreviewModal({ letter, onClose, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Reset editing state whenever a different letter is opened.
  useEffect(() => {
    setIsEditing(false);
    setDraft(letter?.content ?? "");
  }, [letter]);

  if (!letter) return null;

  // Mailed letters are locked — the physical copy is already in transit.
  const canEdit = !!onSave && !letter.mailedAt;
  const dirty = draft !== letter.content;

  const handleSave = () => {
    if (onSave && dirty) onSave(letter.agencyKey, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(letter.content);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isEditing ? undefined : onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-card-hover max-h-[92vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
              {isEditing ? "Editing Dispute Letter" : "Dispute Letter"}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-base font-bold text-gray-900">
                {letter.agencyName}
              </div>
              {letter.isEdited && !isEditing && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-[10px] font-semibold text-amber-700">
                  <Pencil className="w-2.5 h-2.5" />
                  Edited
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!dirty}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save changes
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
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
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 px-5 sm:px-8 py-6">
          {isEditing ? (
            <div className="max-w-2xl mx-auto">
              <div className="mb-2 text-xs text-gray-500">
                Make any changes you need. Your edits are used for the PDF and
                the mailed copy.
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck
                className="w-full min-h-[52vh] bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8 font-mono text-[12px] leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 resize-y"
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-10">
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-gray-800">
                {letter.content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer (mobile actions) */}
        {!isEditing && (
          <div className="sm:hidden px-5 py-3 border-t border-gray-100 flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
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
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Pencil, Trash2, FileText } from "lucide-react";
import type {
  DealOffer,
  DealOfferDocument,
} from "@/types/income-funding-types";
import { formatUSD } from "@/lib/underwriting";
import { ConfirmButton } from "@/components/Confirmation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/i;

const cleanFileName = (fileName: string) => {
  if (fileName.startsWith("OFFER_DOCUMENT_")) {
    fileName = fileName.replace(/^OFFER_DOCUMENT_\d+_/, "");
  }
  fileName = fileName.replace(UUID_PREFIX_RE, "");
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    fileName =
      fileName.substring(0, lastDot).replace(/[-_]/g, " ") +
      fileName.substring(lastDot);
  } else {
    fileName = fileName.replace(/[-_]/g, " ");
  }
  return fileName;
};

interface ExistingOffersListProps {
  offers: DealOffer[];
  onDelete: (id: string) => void;
  onEdit?: (offer: DealOffer) => void;
}

export function ExistingOffersList({
  offers,
  onDelete,
  onEdit,
}: ExistingOffersListProps) {
  const [previewDoc, setPreviewDoc] = useState<DealOfferDocument | null>(null);

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">
          No offers added yet. Use the form above to create the first offer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900">
        Existing offers ({offers.length})
      </h3>
      <ul className="space-y-2">
        {offers.map((o) => (
          <li
            key={o.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-center gap-3 flex-wrap"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                {o.dealType}
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-2">
                  {o.lenderName}
                </div>
                <div className="text-xs text-gray-500">
                  {formatUSD(o.fundingAmount)} · factor{" "}
                  {o.factorRate.toFixed(2)} · {o.termLength} {o.termUnit}
                </div>
                <div>
                  {o.brokerageName && (
                    <span className="font-semibold text-sm text-gray-900 truncate flex items-center gap-2">
                      Brokerage: {o.brokerageName}
                    </span>
                  )}
                </div>
                {o.documents && o.documents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {o.documents.map((doc, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-semibold text-brand-600 hover:bg-brand-50 hover:border-brand-100 transition truncate max-w-[200px]"
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {cleanFileName(doc.name.split("/").pop() || "")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {o.status === "Accepted" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mr-2">
                  Accepted
                </span>
              )}
              {o.status === "Skipped" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-red-100 text-red-500 border border-red-200 mr-2">
                  Skipped
                </span>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(o)}
                  disabled={o.status === "Accepted" || o.status === "Skipped"}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition disabled:opacity-50 disabled:pointer-events-none"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <ConfirmButton
                description={`Are you sure you want to delete this offer from ${o.lenderName}?`}
                onConfirm={() => onDelete(o.id)}
                confirmLabel="Delete"
                classNameAction="bg-red-600 hover:bg-red-700"
                trigger={
                  <button
                    disabled={o.status === "Accepted" || o.status === "Skipped"}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:pointer-events-none"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          </li>
        ))}
      </ul>

      <Sheet
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="p-4 pb-2 border-b flex-shrink-0">
            <SheetTitle className="text-sm break-words text-left leading-snug">
              {previewDoc &&
                cleanFileName(previewDoc.name.split("/").pop() || "")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-2">
            {previewDoc && (
              <iframe
                src={`${previewDoc.url.startsWith("http") ? previewDoc.url : `/api/documents/preview?path=${encodeURIComponent(previewDoc.url)}`}#toolbar=1&view=FitH`}
                title={previewDoc.name}
                className="w-full h-full"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

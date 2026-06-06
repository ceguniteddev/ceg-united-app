import { useEffect, useMemo, useState } from "react";
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
  Trash2Icon,
  Eye,
  Loader2Icon,
} from "lucide-react";
import { formatFileSize } from "@/lib/credit-repair/myDocuments";
import { DocumentLibraryPicker } from "./DocumentLibraryPicker";
import { useAuth } from "@/provider/AuthContext";
import {
  useUserDocumentMutation,
  useUserDocumentsQuery,
} from "@/hooks/document";
import UploadFile from "@/components/UploadFileV2";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/document-types";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface AttachDocumentsResult {
  /** required identity template paths that are checked */
  requiredIds: string[];
  /** optional template paths that are checked */
  optionalIds: string[];
  /** user library document paths that are attached */
  libraryIds: string[];
  /** true once user confirms SSN-redaction notice */
  redactionConfirmed: boolean;
}

interface Props {
  recipientLabel: string;
  recipientSubLabel?: string;
  letterCount: number;
  reasonCodes: string[];
  initial?: AttachDocumentsResult;
  onBack: () => void;
  onContinue: (result: AttachDocumentsResult) => void;
}

const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/i;

export const cleanFileName = (fileName: string) => {
  const matchingDocType = DOCUMENT_TYPES.find((dt) =>
    fileName.startsWith(dt.id + "_"),
  );
  if (matchingDocType) {
    fileName = fileName.substring((matchingDocType.id + "_").length);
  }
  fileName = fileName.replace(UUID_PREFIX_RE, "");
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    fileName =
      fileName.substring(0, lastDot).replace(/-/g, " ") +
      fileName.substring(lastDot);
  } else {
    fileName = fileName.replace(/-/g, " ");
  }
  return fileName;
};

const REQUIRED_DOC_TYPES = ["DRIVERS_LICENSE", "SSN_CARD", "PROOF_OF_ADDRESS"];
const OPTIONAL_DOC_TYPES = [
  "FTC_REPORT",
  "POLICE_REPORT",
  "BANKRUPTCY_PAPERS",
  "PAYMENT_RECEIPT",
  "GOODWILL_LETTER",
  "CEASE_AND_DESIST",
  "METHOD_OF_VERIFICATION",
  "ACCOUNT_CLOSURE_CONFIRMATION",
];

export function AttachDocumentsStep({
  recipientLabel,
  recipientSubLabel,
  letterCount,
  initial,
  onBack,
  onContinue,
}: Props) {
  const { user } = useAuth();
  const userId = user?.uid || "";
  const { userDocuments, refetch } = useUserDocumentsQuery({
    userId,
  });
  const { deleteDocument, isDeleting } = useUserDocumentMutation();

  const [requiredIds, setRequiredIds] = useState<string[]>(
    initial?.requiredIds ?? [],
  );
  const [optionalIds, setOptionalIds] = useState<string[]>(
    initial?.optionalIds ?? [],
  );
  const [libraryIds, setLibraryIds] = useState<string[]>(
    initial?.libraryIds ?? [],
  );
  const [redactionConfirmed, setRedactionConfirmed] = useState(
    initial?.redactionConfirmed ?? false,
  );

  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);

  // Group docs
  const { requiredDocs, optionalDocs, otherDocs } = useMemo(() => {
    const req: any[] = [];
    const opt: any[] = [];
    const oth: any[] = [];
    if (!userDocuments)
      return { requiredDocs: req, optionalDocs: opt, otherDocs: oth };

    userDocuments.forEach((doc: any) => {
      const fileName = doc.name.split("/").pop() || "";
      const matchingDocType = DOCUMENT_TYPES.find((dt) =>
        fileName.startsWith(dt.id + "_"),
      );

      if (matchingDocType) {
        if (REQUIRED_DOC_TYPES.includes(matchingDocType.id)) {
          req.push({ ...doc, docType: matchingDocType });
        } else if (OPTIONAL_DOC_TYPES.includes(matchingDocType.id)) {
          opt.push({ ...doc, docType: matchingDocType });
        } else {
          oth.push({ ...doc, docType: matchingDocType });
        }
      } else {
        oth.push({ ...doc, docType: null });
      }
    });
    return { requiredDocs: req, optionalDocs: opt, otherDocs: oth };
  }, [userDocuments]);

  // Pre-select required docs if none are selected and they just loaded
  useEffect(() => {
    if (requiredDocs.length > 0 && requiredIds.length === 0 && !initial) {
      setRequiredIds(requiredDocs.map((d) => d.path));
    }
  }, [requiredDocs, requiredIds, initial]);

  const toggle = (
    id: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleOpenDeleteDialog = (doc: any) => {
    setDocToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    await deleteDocument({ path: docToDelete.path });
    setIsDeleteDialogOpen(false);
    setDocToDelete(null);
    refetch();
    // Remove from selections
    setRequiredIds((prev) => prev.filter((p) => p !== docToDelete.path));
    setOptionalIds((prev) => prev.filter((p) => p !== docToDelete.path));
    setLibraryIds((prev) => prev.filter((p) => p !== docToDelete.path));
  };

  const summary = useMemo(() => {
    const allSelected = [...requiredIds, ...optionalIds, ...libraryIds];
    const selectedDocs = (userDocuments || []).filter((d: any) =>
      allSelected.includes(d.path),
    );
    const totalCount = selectedDocs.length;
    const totalBytes = selectedDocs.reduce(
      (s: number, d: any) => s + (d.size || 0),
      0,
    );
    const pages = 1 + totalCount; // 1 page letter + ~1 page per attachment
    const postageClass =
      pages <= 5
        ? "USPS First-Class (1 oz)"
        : `USPS First-Class (${Math.ceil(pages / 5)} oz)`;
    return { totalCount, totalBytes, pages, postageClass };
  }, [requiredIds, optionalIds, libraryIds, userDocuments]);

  const hasDL = requiredDocs.some(
    (d) => d.docType?.id === "DRIVERS_LICENSE" && requiredIds.includes(d.path),
  );
  const hasPOA = requiredDocs.some(
    (d) => d.docType?.id === "PROOF_OF_ADDRESS" && requiredIds.includes(d.path),
  );
  const canContinue = hasDL && hasPOA && redactionConfirmed;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const getMissingRequired = () => {
    const missing = [];
    if (!requiredDocs.some((d) => d.docType?.id === "DRIVERS_LICENSE")) {
      missing.push(DOCUMENT_TYPES.find((d) => d.id === "DRIVERS_LICENSE"));
    }
    if (!requiredDocs.some((d) => d.docType?.id === "SSN_CARD")) {
      missing.push(DOCUMENT_TYPES.find((d) => d.id === "SSN_CARD"));
    }
    if (!requiredDocs.some((d) => d.docType?.id === "PROOF_OF_ADDRESS")) {
      missing.push(DOCUMENT_TYPES.find((d) => d.id === "PROOF_OF_ADDRESS"));
    }
    return missing.filter(Boolean) as DocumentType[];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Mail Letter — Step 1 of 3
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">
            Attach Supporting Documents
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Most credit disputes require proof of identity and address. Select
            what to mail with your letter.
          </p>
        </div>

        <Section
          icon={<ShieldCheck className="w-4 h-4" />}
          iconTone="brand"
          title="Required Identity Documents"
          subtitle="Bureaus reject disputes without these. Recommended on by default."
        >
          <div className="space-y-4">
            {requiredDocs.length > 0 && (
              <div className="space-y-2">
                {requiredDocs.map((doc) => (
                  <DocCheckRow
                    key={doc.path}
                    doc={doc}
                    checked={requiredIds.includes(doc.path)}
                    onToggle={() =>
                      toggle(doc.path, requiredIds, setRequiredIds)
                    }
                    onDelete={() => handleOpenDeleteDialog(doc)}
                    onPreview={() => setPreviewDoc(doc)}
                    badge={
                      doc.docType?.id === "DRIVERS_LICENSE" ||
                      doc.docType?.id === "PROOF_OF_ADDRESS"
                        ? "Required"
                        : "Recommended"
                    }
                  />
                ))}
              </div>
            )}

            {getMissingRequired().map((dt) => (
              <div key={dt.id} className="mt-4">
                <UploadFile
                  userId={userId}
                  documentType={dt}
                  titleOverride={`Missing: ${dt.title}`}
                  descriptionOverride={dt.description}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section
          icon={<Sparkles className="w-4 h-4" />}
          iconTone="violet"
          title="Optional Supporting Documents"
          subtitle="Add proof that strengthens specific dispute reasons."
        >
          <div className="space-y-4">
            {optionalDocs.length > 0 && (
              <div className="space-y-2">
                {optionalDocs.map((doc) => (
                  <DocCheckRow
                    key={doc.path}
                    doc={doc}
                    checked={optionalIds.includes(doc.path)}
                    onToggle={() =>
                      toggle(doc.path, optionalIds, setOptionalIds)
                    }
                    onDelete={() => handleOpenDeleteDialog(doc)}
                    onPreview={() => setPreviewDoc(doc)}
                  />
                ))}
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
              Need to attach a Police Report, FTC Report, or other specific
              proof? Upload it in the library below.
            </div>
          </div>
        </Section>

        <Section
          icon={<Layers className="w-4 h-4" />}
          iconTone="emerald"
          title="From My Documents Library"
          subtitle="Files you've already uploaded to CEG - reuse them on this dispute."
        >
          <DocumentLibraryPicker
            userId={userId}
            docs={otherDocs}
            selectedIds={libraryIds}
            onToggle={(id) => toggle(id, libraryIds, setLibraryIds)}
            onPreview={setPreviewDoc}
            onDelete={handleOpenDeleteDialog}
          />
        </Section>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                Privacy & SSN Protection
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                We recommend redacting all but the last 4 digits of your SSN on
                any documents containing it. CEG never stores your full SSN.
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
              onContinue({
                requiredIds,
                optionalIds,
                libraryIds,
                redactionConfirmed,
              })
            }
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${
              canContinue
                ? "bg-brand-600 hover:bg-brand-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Continue to Mailing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
              Mailing summary
            </div>
            <div className="mt-2 space-y-3">
              <SummaryRow
                icon={<Mail className="w-4 h-4" />}
                label="Mailing to"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {recipientLabel}
                </div>
                {recipientSubLabel && (
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {recipientSubLabel}
                  </div>
                )}
              </SummaryRow>
              <SummaryRow
                icon={<FileCheck2 className="w-4 h-4" />}
                label="Letter"
              >
                <div className="text-sm text-gray-700">
                  {letterCount === 1
                    ? "1 page"
                    : `${letterCount} letters × 1 page`}
                </div>
              </SummaryRow>
              <SummaryRow
                icon={<Layers className="w-4 h-4" />}
                label="Attachments"
              >
                <div className="text-sm text-gray-700">
                  {summary.totalCount} document
                  {summary.totalCount === 1 ? "" : "s"}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {formatFileSize(summary.totalBytes || 0)} total
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
                  <span className="text-gray-900 font-medium">
                    {summary.postageClass}
                  </span>
                </div>
              </div>
            </div>

            <button
              disabled={!canContinue}
              onClick={() =>
                onContinue({
                  requiredIds,
                  optionalIds,
                  libraryIds,
                  redactionConfirmed,
                })
              }
              className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${
                canContinue
                  ? "bg-brand-600 hover:bg-brand-700 shadow-sm"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Continue to Mailing
              <ArrowRight className="w-4 h-4" />
            </button>
            {!canContinue && (
              <div className="mt-2 text-[11px] text-gray-500 leading-relaxed flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  Driver’s License + Proof of Address are required, plus the
                  redaction confirmation.
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

      <Sheet
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[85vh] flex flex-col p-0 z-[100]"
        >
          <SheetHeader className="p-4 pb-2 border-b flex-shrink-0">
            <SheetTitle className="text-sm break-words text-left leading-snug">
              {previewDoc &&
                cleanFileName(previewDoc.name.split("/").pop() || "")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-2">
            {previewDoc?.contentType?.startsWith("image/") ? (
              <ImageZoom>
                <Image
                  src={previewDoc.signedUrl}
                  alt={previewDoc.name}
                  className="w-full h-full object-contain"
                  width={800}
                  height={600}
                  unoptimized
                />
              </ImageZoom>
            ) : previewDoc?.contentType === "application/pdf" ? (
              <iframe
                src={`${previewDoc.signedUrl}#toolbar=1&view=FitH`}
                title={previewDoc.name}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  Preview unavailable for this file type
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete:
              <span className="font-semibold block mt-2 break-all text-xs sm:text-sm text-gray-700">
                {cleanFileName(docToDelete?.name.split("/").pop() || "")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="cursor-pointer w-full sm:w-auto"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer w-full sm:w-auto"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isDeleting ? "Deleting..." : "Yes, Delete File"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({
  icon,
  iconTone,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  iconTone: "brand" | "violet" | "emerald";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const toneClass =
    iconTone === "brand"
      ? "bg-brand-50 text-brand-700"
      : iconTone === "violet"
        ? "bg-violet-50 text-violet-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneClass}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">{title}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

export function DocCheckRow({
  doc,
  checked,
  onToggle,
  onDelete,
  onPreview,
  badge,
  badgeTone = "brand",
}: {
  doc: any;
  checked: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onPreview: () => void;
  badge?: string;
  badgeTone?: "brand" | "amber";
}) {
  const badgeClass =
    badgeTone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-brand-50 text-brand-700 border-brand-100";

  const rawName = doc.name.split("/").pop() || "";
  const displayName = cleanFileName(rawName);

  return (
    <div
      onClick={onToggle}
      className={`group w-full text-left rounded-xl border p-3 transition-all flex items-start gap-3 cursor-pointer ${
        checked
          ? "border-brand-500 bg-brand-50/40 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked
            ? "bg-brand-600 border-brand-600 text-white"
            : "border-gray-300 bg-white"
        }`}
      >
        {checked && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold text-gray-900 truncate"
            title={displayName}
          >
            {displayName}
          </span>
          {badge && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
          {doc.docType ? doc.docType.title : "Document"}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onPreview}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>

      <div className="hidden sm:block text-[11px] font-mono tabular-nums text-gray-400 shrink-0 ml-2 mt-1.5">
        ~{formatFileSize(doc.size || 0)}
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
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
  );
}

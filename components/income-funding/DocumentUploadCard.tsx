import { useRef, useState } from "react";
import {
  FileText,
  Building,
  Receipt,
  IdCard,
  Landmark,
  Upload,
  Check,
  Link as LinkIcon,
  X,
  Eye,
  SaveIcon,
  Loader2Icon,
} from "lucide-react";
import type { DocumentRecord } from "@/types/income-funding-types";
import { useForm } from "react-hook-form";
import { FormEINInput } from "@/components/forms/form-ein-number-input";
import { Button } from "../ui/button";
import IconMenu from "../icon-menu";

interface DocumentUploadCardProps {
  doc: DocumentRecord;
  onUpload: (
    key: DocumentRecord["key"],
    file: File,
    fileName: string,
    fileSize: string,
  ) => void;
  onRemove?: (key: DocumentRecord["key"]) => void;
  onView?: (url: string, title: string, contentType?: string) => void;
  onUpdateEin?: (ein: string) => void;
  isUpdatingEin?: boolean;
  isUploading?: boolean;
}

const iconMap: Record<string, any> = {
  ein: FileText,
  articles: Building,
  voidedCheck: Receipt,
  id: IdCard,
  bankStatements: Landmark,
  paystubs: FileText,
};

export function DocumentUploadCard({
  doc,
  onUpload,
  onRemove,
  onView,
  onUpdateEin,
  isUpdatingEin,
  isUploading,
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const Icon = iconMap[doc.key] || FileText;

  const form = useForm({ defaultValues: { ein: "" } });

  const handleFile = (file: File) => {
    const sizeKb = file.size / 1024;
    const size =
      sizeKb > 1024
        ? `${(sizeKb / 1024).toFixed(1)} MB`
        : `${Math.round(sizeKb)} KB`;
    onUpload(doc.key, file, file.name, size);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const isUploaded = doc.status === "uploaded";
  const isSynced = doc.status === "synced";
  const isDone = isUploaded || isSynced;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`group relative bg-white rounded-2xl border p-5 transition-all
        ${
          isDone
            ? "border-emerald-200 shadow-card"
            : dragOver
              ? "border-brand-500 bg-brand-50 shadow-card-hover"
              : "border-gray-100 shadow-card hover:shadow-card-hover"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            ${
              isDone
                ? "bg-emerald-50 text-emerald-600"
                : "bg-brand-50 text-brand-600 group-hover:bg-brand-100"
            }`}
        >
          {isSynced ? (
            <LinkIcon className="w-[18px] h-[18px]" />
          ) : isUploaded ? (
            <Check className="w-[18px] h-[18px]" strokeWidth={3} />
          ) : (
            <Icon className="w-[18px] h-[18px]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900">{doc.title}</h3>
            {doc.required ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                Required
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                Optional
              </span>
            )}
            {isSynced && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                <Check className="w-3 h-3" strokeWidth={3} /> Synced
              </span>
            )}
            {isUploaded && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                <Check className="w-3 h-3" strokeWidth={3} /> Uploaded
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {doc.description}
          </p>
          {(doc as any).providedValue && (
            <div className="mt-2 inline-flex bg-emerald-50 border border-emerald-100 px-2 py-1 rounded text-xs font-mono font-bold text-emerald-700">
              Provided: {(doc as any).providedValue}
            </div>
          )}

          {isDone ? (
            <div className="mt-3 flex flex-col gap-2">
              {doc.files && doc.files.length > 0 ? (
                doc.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-xs text-gray-600 border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-medium text-gray-700 truncate">
                      {file.fileName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 shrink-0">
                        {file.fileSize}
                      </span>
                      {file.signedUrl && onView && (
                        <button
                          onClick={() =>
                            onView(
                              file.signedUrl!,
                              file.fileName,
                              file.contentType,
                            )
                          }
                          className="p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                  <span className="font-medium text-gray-700 truncate">
                    {doc.fileName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 shrink-0">
                      {doc.fileSize}
                    </span>
                    {doc.signedUrl && onView && (
                      <button
                        onClick={() =>
                          onView(
                            doc.signedUrl!,
                            doc.fileName || doc.title,
                            doc.contentType,
                          )
                        }
                        className="p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!isSynced && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button
                    disabled={isUploading}
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? "Uploading..." : "Upload more"}
                  </button>
                  <span className="text-xs text-gray-400">
                    or drop files here
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? "Uploading..." : "Upload file"}
                </button>
                <span className="text-xs text-gray-400">
                  or drop a file here
                </span>
              </div>

              {doc.key === "ein" &&
                !(doc as any).providedValue &&
                onUpdateEin && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      Or enter your EIN directly:
                    </span>
                    <form
                      onSubmit={form.handleSubmit((data) =>
                        onUpdateEin(data.ein),
                      )}
                      className="flex items-end gap-3"
                    >
                      <div className="flex-1 max-w-[200px]">
                        <FormEINInput
                          control={form.control}
                          name="ein"
                          label=""
                          placeholder="XX-XXXXXXX"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!form.watch("ein") || isUpdatingEin}
                        className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <IconMenu
                          text={isUpdatingEin ? "Saving..." : "Save"}
                          icon={
                            isUpdatingEin ? (
                              <Loader2Icon className="animate-spin" />
                            ) : (
                              <SaveIcon />
                            )
                          }
                        />
                      </Button>
                    </form>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.heic"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach((f) => handleFile(f));
        }}
      />
    </div>
  );
}

// page.tsx

"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUserDocumentMutation,
  useUserDocumentsQuery,
} from "@/hooks/document";
import { useAuth } from "@/provider/AuthContext";
import UploadFile from "@/components/UploadFileV2";
import {
  CheckCircle2,
  FolderArchive,
  Loader2Icon,
  Trash2Icon,
  XCircle,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  FileX,
  FileStack,
  Search,
  Calendar,
  HardDrive,
  Eye,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import Image from "next/image";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/document-types";
import { cn } from "@/lib/utils";

const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/i;

const cleanFileName = (fileName: string) => {
  const matchingDocType = DOCUMENT_TYPES.find((dt) =>
    fileName.startsWith(dt.id + "_"),
  );
  if (matchingDocType) {
    fileName = fileName.substring((matchingDocType.id + "_").length);
  }
  fileName = fileName.replace(UUID_PREFIX_RE, "");
  // Replace hyphens with spaces for readability
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

const truncateForMobile = (fileName: string) => {
  if (fileName.length > 20) {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      const extension = fileName.substring(lastDotIndex);
      const nameWithoutExt = fileName.substring(0, lastDotIndex);
      return `${nameWithoutExt.substring(0, 20)}....${extension}`;
    }
    return `${fileName.substring(0, 20)}....`;
  }
  return fileName;
};

// File type icon config
const getFileIconConfig = (contentType?: string, name?: string) => {
  const ext = (name?.split(".").pop() || "").toLowerCase();
  const mime = contentType || "";
  if (mime === "application/pdf" || ext === "pdf")
    return { Icon: FileText, color: "text-red-500", bg: "bg-red-50" };
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ext === "xlsx" ||
    ext === "csv"
  )
    return {
      Icon: FileSpreadsheet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    };
  if (
    mime.startsWith("image/") ||
    ext === "png" ||
    ext === "jpg" ||
    ext === "jpeg"
  )
    return { Icon: ImageIcon, color: "text-violet-500", bg: "bg-violet-50" };
  return { Icon: File, color: "text-gray-500", bg: "bg-gray-100" };
};

// Category color config
const getCategoryBadge = (docType?: DocumentType) => {
  if (!docType) return { label: "Other", color: "bg-gray-100 text-gray-600" };
  const categoryColors: Record<string, string> = {
    "funding-analysis": "bg-violet-50 text-violet-700",
    "business-documents": "bg-blue-50 text-blue-700",
    "personal-documents": "bg-amber-50 text-amber-700",
    "tax-documents": "bg-rose-50 text-rose-700",
    "credit-reports": "bg-emerald-50 text-emerald-700",
  };
  return {
    label: docType.title,
    color: categoryColors[docType.category] || "bg-gray-100 text-gray-600",
  };
};

// Skeleton loading rows
const DocumentsSkeleton = () => (
  <div className="space-y-3 mt-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-4"
      >
        <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full hidden sm:block" />
      </div>
    ))}
  </div>
);

// Unified document list (all screen sizes)
const DocList = ({
  docs,
  onDelete,
  isDeleting,
  isFiltered,
  onClearFilter,
}: {
  docs: UserDoc[];
  onDelete: (doc: UserDoc) => void;
  isDeleting: boolean;
  isFiltered?: boolean;
  onClearFilter?: () => void;
}) => {
  const [previewDoc, setPreviewDoc] = useState<UserDoc | null>(null);

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 sm:p-14 text-center animate-fade-in-up mt-3">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
            <FileX className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {isFiltered ? "No documents found" : "No documents yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isFiltered
                ? "Try adjusting your search or filter"
                : "Upload your first document using the uploader above"}
            </p>
          </div>
          {isFiltered && onClearFilter && (
            <button
              onClick={onClearFilter}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
            >
              View all documents
            </button>
          )}
        </div>
      </div>
    );
  }

  const staggerClasses = [
    "stagger-1",
    "stagger-2",
    "stagger-3",
    "stagger-4",
    "stagger-5",
    "stagger-6",
    "stagger-7",
    "stagger-8",
  ];

  return (
    <>
      <div className="space-y-3 mt-3">
        {docs.map((doc, i) => {
          const isReadOnly = doc.path.toLowerCase().includes("asset-report");
          const rawName = doc.name.split("/").pop() || "";
          const displayName = cleanFileName(rawName);
          const { Icon, color, bg } = getFileIconConfig(
            doc.contentType,
            rawName,
          );
          const matchedType = DOCUMENT_TYPES.find((dt) =>
            rawName.startsWith(dt.id + "_"),
          );
          const badge = getCategoryBadge(matchedType);
          const sizeKB = (doc.size / 1024).toFixed(1);
          const updatedDate = doc.updated
            ? new Date(doc.updated).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;
          const stagger = staggerClasses[i % staggerClasses.length];

          return (
            <div
              key={doc.path}
              className={cn(
                "group bg-white rounded-xl border border-gray-100 shadow-sm card-hover animate-fade-in-up",
                stagger,
              )}
            >
              <div
                className="p-4 sm:p-5 flex items-center gap-4 cursor-pointer min-w-0"
                onClick={() => setPreviewDoc(doc)}
              >
                {/* File icon badge */}
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center",
                    bg,
                  )}
                >
                  <Icon className={cn("w-5 h-5", color)} />
                </div>

                {/* Name + meta + mobile actions */}
                <div className="flex-1 min-w-0">
                  {/* Category badge */}
                  <span
                    className={cn(
                      "inline-block mb-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
                      badge.color,
                    )}
                  >
                    {badge.label}
                  </span>
                  <p
                    className="text-sm font-semibold text-gray-900 line-clamp-2 sm:truncate sm:line-clamp-none"
                    title={displayName}
                  >
                    {displayName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <HardDrive className="w-3 h-3" />
                      {sizeKB} KB
                    </span>
                    {updatedDate && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {updatedDate}
                      </span>
                    )}
                  </div>
                  {/* Mobile actions — below meta, hidden on sm+ */}
                  <div
                    className="flex items-center gap-1 mt-2 sm:hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 gap-1.5"
                      asChild
                      title="Download"
                    >
                      <a
                        href={doc.downloadUrl || doc.signedUrl}
                        download={rawName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-xs">Download</span>
                      </a>
                    </Button>
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 gap-1.5"
                        onClick={() => onDelete(doc)}
                        disabled={isDeleting}
                        title="Delete"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                        <span className="text-xs">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop actions — icon-only, hover reveal, hidden on mobile */}
                <div
                  className="hidden sm:flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    asChild
                    title="Download"
                  >
                    <a
                      href={doc.downloadUrl || doc.signedUrl}
                      download={rawName}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(doc)}
                      disabled={isDeleting}
                      title="Delete"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Sheet */}
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
    </>
  );
};

export default function ClientDocuments({ userId }: { userId: string }) {
  const { userDocuments, isLoading, refetch } = useUserDocumentsQuery({
    userId,
  });
  const { deleteDocument, isDeleting } = useUserDocumentMutation();

  const [selectedDocType, setSelectedDocType] = useState<
    DocumentType | "OTHER" | "ALL"
  >("ALL");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<UserDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { requiredDocsMap, otherDocs } = useMemo(() => {
    const requiredDocsMap = new Map<string, UserDoc[]>();
    const otherDocs: UserDoc[] = [];

    if (!userDocuments) {
      return { requiredDocsMap, otherDocs };
    }

    userDocuments.forEach((doc: any) => {
      const fileName = doc.name.split("/").pop() || "";
      const matchingDocType = DOCUMENT_TYPES.find((dt) =>
        fileName.startsWith(dt.id + "_"),
      );
      if (matchingDocType) {
        if (!requiredDocsMap.has(matchingDocType.id)) {
          requiredDocsMap.set(matchingDocType.id, []);
        }
        requiredDocsMap.get(matchingDocType.id)?.push(doc);
      } else {
        otherDocs.push(doc);
      }
    });

    return { requiredDocsMap, otherDocs };
  }, [userDocuments]);

  const currentRequiredDocuments = useMemo(() => {
    if (typeof selectedDocType === "string") return [];
    return requiredDocsMap.get(selectedDocType.id) || [];
  }, [requiredDocsMap, selectedDocType]);

  const allDocuments = useMemo(() => {
    const allDocs: UserDoc[] = [];
    requiredDocsMap.forEach((docs) => {
      allDocs.push(...docs);
    });
    allDocs.push(...otherDocs);
    return allDocs;
  }, [requiredDocsMap, otherDocs]);

  // Filtered docs based on search query
  const displayDocs = useMemo(() => {
    const base =
      selectedDocType === "ALL"
        ? allDocuments
        : selectedDocType === "OTHER"
          ? otherDocs
          : currentRequiredDocuments;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((d) =>
      cleanFileName(d.name.split("/").pop() || "")
        .toLowerCase()
        .includes(q),
    );
  }, [
    selectedDocType,
    allDocuments,
    otherDocs,
    currentRequiredDocuments,
    searchQuery,
  ]);

  const handleOpenDeleteDialog = (doc: UserDoc) => {
    setDocToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!docToDelete) return;
    await deleteDocument({ path: docToDelete.path });
    setIsDeleteDialogOpen(false);
    setDocToDelete(null);
    refetch();
  }, [docToDelete, refetch, deleteDocument]);

  const selectedDocTypeLabel =
    selectedDocType === "ALL"
      ? "All Documents"
      : selectedDocType === "OTHER"
        ? "Other Documents"
        : DOCUMENT_TYPES.find((dt) => dt.id === selectedDocType.id)?.title ||
          "Select Document Type";

  const baseDocs =
    selectedDocType === "ALL"
      ? allDocuments
      : selectedDocType === "OTHER"
        ? otherDocs
        : currentRequiredDocuments;

  const isFiltered = searchQuery.trim().length > 0;

  return (
    <main className="flex flex-col gap-5 p-3 sm:p-5 w-full max-w-full overflow-x-hidden">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 animate-fade-in-up">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your personal or business documents
          </p>
        </div>
        {!isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
            <FileStack className="w-3.5 h-3.5" />
            {allDocuments.length} total document
            {allDocuments.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Document type select */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Document Type
            </label>
            <Select
              value={
                selectedDocType === "ALL"
                  ? "ALL"
                  : selectedDocType === "OTHER"
                    ? "OTHER"
                    : selectedDocType.id
              }
              onValueChange={(value) => {
                setSearchQuery("");
                if (value === "ALL") {
                  setSelectedDocType("ALL");
                } else if (value === "OTHER") {
                  setSelectedDocType("OTHER");
                } else {
                  const docType = DOCUMENT_TYPES.find((dt) => dt.id === value);
                  if (docType) setSelectedDocType(docType);
                }
              }}
            >
              <SelectTrigger className="w-full h-10 bg-gray-50 border-gray-200 focus:ring-blue-500">
                <SelectValue placeholder="Select a document type">
                  <div className="flex items-center gap-2">
                    {selectedDocType === "ALL" ? (
                      <>
                        <FolderArchive className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="flex-grow text-left text-sm text-gray-700">
                          {selectedDocTypeLabel}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0">
                          {allDocuments.length}
                        </span>
                      </>
                    ) : selectedDocType === "OTHER" ? (
                      <>
                        <FolderArchive className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="flex-grow text-left text-sm text-gray-700">
                          Other Documents
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0">
                          {otherDocs.length}
                        </span>
                      </>
                    ) : (
                      <>
                        <selectedDocType.icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="flex-grow text-left text-sm text-gray-700">
                          {selectedDocTypeLabel}
                        </span>
                        {(() => {
                          const uploadedDocs =
                            requiredDocsMap.get(selectedDocType.id) || [];
                          return uploadedDocs.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                {uploadedDocs.length}
                              </span>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                          );
                        })()}
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                className="max-h-[70vh] overflow-y-auto"
                position="item-aligned"
              >
                <SelectItem value="ALL" className="py-3">
                  <div className="flex items-center gap-2 w-full">
                    <FolderArchive className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span className="flex-grow text-sm">All Documents</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0">
                      {allDocuments.length}
                    </span>
                  </div>
                </SelectItem>
                {DOCUMENT_TYPES.map((docType) => {
                  const uploadedDocs = requiredDocsMap.get(docType.id) || [];
                  const isUploaded = uploadedDocs.length > 0;
                  return (
                    <SelectItem
                      key={docType.id}
                      value={docType.id}
                      className="py-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <docType.icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="flex-grow text-sm">
                          {docType.title}
                        </span>
                        {isUploaded ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {uploadedDocs.length}
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
                <SelectItem value="OTHER" className="py-3">
                  <div className="flex items-center gap-2 w-full">
                    <FolderArchive className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span className="flex-grow text-sm">Other Documents</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0">
                      {otherDocs.length}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search input */}
          <div className="flex-1 min-w-0 sm:max-w-xs">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upload zone (shown for specific / other types) */}
      {selectedDocType !== "ALL" && (
        <div className="animate-fade-in-up stagger-2">
          {selectedDocType === "OTHER" ? (
            <UploadFile userId={userId} />
          ) : (
            <UploadFile userId={userId} documentType={selectedDocType} />
          )}
        </div>
      )}

      {/* Document list */}
      <section className="w-full">
        {isLoading ? (
          <DocumentsSkeleton />
        ) : (
          <DocList
            docs={displayDocs}
            onDelete={handleOpenDeleteDialog}
            isDeleting={isDeleting}
            isFiltered={isFiltered}
            onClearFilter={() => setSearchQuery("")}
          />
        )}
      </section>

      {/* Footer count */}
      {!isLoading && baseDocs.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-2 animate-fade-in">
          <FileStack className="w-3.5 h-3.5" />
          <span>
            {displayDocs.length} of {baseDocs.length} document
            {baseDocs.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
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
    </main>
  );
}

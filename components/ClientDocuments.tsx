// page.tsx

"use client";

import Spinner from "@/components/Spinner";
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
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import Image from "next/image";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/document-types";

// A new, reusable component to display a list of documents
const DocumentPreviewer = ({
  docs,
  onDelete,
  isDeleting,
  isAdmin,
}: {
  docs: UserDoc[];
  onDelete: (doc: UserDoc) => void;
  isDeleting: boolean;
  isAdmin: boolean;
}) => {
  if (docs.length === 0) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 text-center">
        No documents uploaded for this category yet.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const isReadOnly = doc.path.toLowerCase().includes("asset-report");
        return (
          <div
            key={doc.path}
            className="border rounded-lg p-3 shadow-sm bg-white hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
              <div className="flex-1 min-w-0 max-w-full">
                <h3 className="font-semibold text-sm leading-tight truncate overflow-hidden text-ellipsis w-full">
                  {doc.name.split("/").pop()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {doc.contentType ?? "unknown"} •{" "}
                  {(doc.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-0.5">
                <Button
                  variant="ghost"
                  className="cursor-pointer touch-manipulation flex-shrink-0 h-8 w-8 p-0"
                  asChild
                >
                  <a
                    href={doc.downloadUrl || doc.signedUrl}
                    download={doc.name.split("/").pop()}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    className="cursor-pointer touch-manipulation flex-shrink-0 h-8 w-8 p-0"
                    onClick={() => onDelete(doc)}
                    disabled={isDeleting}
                  >
                    <Trash2Icon className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>

            {doc.contentType?.startsWith("image/") ? (
              <div className="overflow-hidden rounded-md">
                <ImageZoom>
                  <Image
                    src={doc.signedUrl}
                    alt={doc.name}
                    className="w-full h-48 sm:h-64 lg:h-80 object-contain rounded-md border bg-gray-50"
                    width={500}
                    height={500}
                    unoptimized
                  />
                </ImageZoom>
              </div>
            ) : doc.contentType === "application/pdf" ? (
              <div className="overflow-hidden rounded-md">
                <iframe
                  src={`${doc.signedUrl}#toolbar=1&view=FitH`}
                  title={doc.name}
                  className="w-full h-48 sm:h-64 lg:h-80 rounded-md border bg-white"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 sm:h-64 lg:h-80 bg-muted rounded-md overflow-hidden">
                <p className="text-xs text-muted-foreground">
                  Preview unavailable
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function ClientDocuments({ userId }: { userId: string }) {
  const { role, isBroker, isAdmin } = useAuth();
  const { userDocuments, isLoading, refetch } = useUserDocumentsQuery({
    userId,
  });
  const { deleteDocument, isDeleting } = useUserDocumentMutation();

  const [selectedDocType, setSelectedDocType] = useState<
    DocumentType | "OTHER"
  >(DOCUMENT_TYPES[0]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<UserDoc | null>(null);

  const { requiredDocsMap, otherDocs } = useMemo(() => {
    // The map will now store an array of documents for each ID
    const requiredDocsMap = new Map<string, UserDoc[]>();
    const otherDocs: UserDoc[] = [];

    if (!userDocuments) {
      return { requiredDocsMap, otherDocs };
    }

    userDocuments.forEach((doc: any) => {
      const fileName = doc.name.split("/").pop() || "";

      const matchingDocType = DOCUMENT_TYPES.find((dt) =>
        fileName.startsWith(dt.id + "_")
      );

      if (matchingDocType) {
        // If this is the first document for this type, initialize the array
        if (!requiredDocsMap.has(matchingDocType.id)) {
          requiredDocsMap.set(matchingDocType.id, []);
        }
        // Push the document into the array for its type
        requiredDocsMap.get(matchingDocType.id)?.push(doc);
      } else {
        otherDocs.push(doc);
      }
    });

    return { requiredDocsMap, otherDocs };
  }, [userDocuments]);

  // This now gets an array of documents for the selected required type
  const currentRequiredDocuments = useMemo(() => {
    if (typeof selectedDocType === "string") return [];
    return requiredDocsMap.get(selectedDocType.id) || [];
  }, [requiredDocsMap, selectedDocType]);

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

  if (isLoading) return <Spinner displayText="Loading documents..." />;

  // Get the current selected document type label for display
  const selectedDocTypeLabel =
    selectedDocType === "OTHER"
      ? "Other Documents"
      : DOCUMENT_TYPES.find((dt) => dt.id === selectedDocType.id)?.title ||
        "Select Document Type";

  return (
    <main className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 max-w-full overflow-hidden">
      {/* Document Type Dropdown */}
      <div className="w-full">
        <h2 className="text-base sm:text-lg font-semibold mb-3">
          Select Document Type
        </h2>
        <Select
          value={selectedDocType === "OTHER" ? "OTHER" : selectedDocType.id}
          onValueChange={(value) => {
            if (value === "OTHER") {
              setSelectedDocType("OTHER");
            } else {
              const docType = DOCUMENT_TYPES.find((dt) => dt.id === value);
              if (docType) setSelectedDocType(docType);
            }
          }}
        >
          <SelectTrigger className="w-full h-10 sm:h-11">
            <SelectValue placeholder="Select a document type">
              <div className="flex items-center gap-2">
                {selectedDocType !== "OTHER" ? (
                  <>
                    <selectedDocType.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow text-left text-sm">
                      {selectedDocTypeLabel}
                    </span>
                    {(() => {
                      const uploadedDocs =
                        requiredDocsMap.get(selectedDocType.id) || [];
                      return uploadedDocs.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground text-background font-medium">
                            {uploadedDocs.length}
                          </span>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <FolderArchive className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow text-left text-sm">
                      Other Documents
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground text-background font-medium flex-shrink-0">
                      {otherDocs.length}
                    </span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[60vh] overflow-y-auto">
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
                    <docType.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow text-sm">{docType.title}</span>
                    {isUploaded ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground text-background font-medium">
                          {uploadedDocs.length}
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </SelectItem>
              );
            })}
            <SelectItem value="OTHER" className="py-3">
              <div className="flex items-center gap-2 w-full">
                <FolderArchive className="h-4 w-4 flex-shrink-0" />
                <span className="flex-grow text-sm">Other Documents</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground text-background font-medium flex-shrink-0">
                  {otherDocs.length}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Display or Upload Section */}
      <section className="w-full max-w-full overflow-hidden">
        {selectedDocType === "OTHER" ? (
          // --- View for "Other Documents" ---
          <div>
            {<UploadFile userId={userId} />}
            <DocumentPreviewer
              docs={otherDocs}
              onDelete={handleOpenDeleteDialog}
              isDeleting={isDeleting}
              isAdmin={isAdmin || isBroker}
            />
          </div>
        ) : (
          // --- View for Required Documents ---
          <div>
            <UploadFile userId={userId} documentType={selectedDocType} />

            <DocumentPreviewer
              docs={currentRequiredDocuments}
              onDelete={handleOpenDeleteDialog}
              isDeleting={isDeleting}
              isAdmin={isAdmin || isBroker}
            />
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog (Unchanged) */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete the
              file
              <span className="font-bold block mt-2 break-all text-xs sm:text-sm">
                {docToDelete?.name.split("/").pop()}
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

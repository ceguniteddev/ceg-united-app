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
    <div className="space-y-3 sm:space-y-4">
      {docs.map((doc) => {
        const isReadOnly = doc.path.toLowerCase().includes("asset-report");
        return (
          <div
            key={doc.path}
            className="border rounded-lg p-3 sm:p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold break-words text-sm sm:text-base">
                  {doc.name.split("/").pop()}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {doc.contentType ?? "unknown"} •{" "}
                  {(doc.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="cursor-pointer touch-manipulation flex-shrink-0"
                  size="icon"
                  asChild
                >
                  <a
                    href={doc.downloadUrl || doc.signedUrl}
                    download={doc.name.split("/").pop()}
                  >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                </Button>
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    className="cursor-pointer touch-manipulation flex-shrink-0"
                    size="icon"
                    onClick={() => onDelete(doc)}
                    disabled={isDeleting}
                  >
                    <Trash2Icon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  </Button>
                )}
              </div>
            </div>

            {doc.contentType?.startsWith("image/") ? (
              <ImageZoom>
                <Image
                  src={doc.signedUrl}
                  alt={doc.name}
                  className="w-full h-64 sm:h-80 md:h-96 object-contain rounded-md border"
                  width={500}
                  height={500}
                  unoptimized
                />
              </ImageZoom>
            ) : doc.contentType === "application/pdf" ? (
              <iframe
                src={`${doc.signedUrl}#toolbar=1&view=FitH`}
                title={doc.name}
                className="w-full h-64 sm:h-80 md:h-96 rounded-md border"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-64 sm:h-80 md:h-96 bg-muted rounded-md">
                <p className="text-xs sm:text-sm text-muted-foreground">
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
    <main className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
      {/* Document Type Dropdown */}
      <div className="w-full">
        <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
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
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a document type">
              <div className="flex items-center gap-2">
                {selectedDocType !== "OTHER" ? (
                  <>
                    <selectedDocType.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="flex-grow text-left">
                      {selectedDocTypeLabel}
                    </span>
                    {(() => {
                      const uploadedDocs =
                        requiredDocsMap.get(selectedDocType.id) || [];
                      return uploadedDocs.length > 0 ? (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-muted-foreground text-background">
                            {uploadedDocs.length}
                          </span>
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        </div>
                      ) : (
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <FolderArchive className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="flex-grow text-left">Other Documents</span>
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-muted-foreground text-background">
                      {otherDocs.length}
                    </span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((docType) => {
              const uploadedDocs = requiredDocsMap.get(docType.id) || [];
              const isUploaded = uploadedDocs.length > 0;

              return (
                <SelectItem key={docType.id} value={docType.id}>
                  <div className="flex items-center gap-2 w-full">
                    <docType.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="flex-grow">{docType.title}</span>
                    {isUploaded ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-muted-foreground text-background">
                          {uploadedDocs.length}
                        </span>
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                    ) : (
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    )}
                  </div>
                </SelectItem>
              );
            })}
            <SelectItem value="OTHER">
              <div className="flex items-center gap-2 w-full">
                <FolderArchive className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="flex-grow">Other Documents</span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-muted-foreground text-background">
                  {otherDocs.length}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Display or Upload Section */}
      <section className="w-full">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              file
              <span className="font-bold block mt-2 break-all">
                {docToDelete?.name.split("/").pop()}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
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

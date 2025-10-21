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
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/document-types";

// A new component to display the selected document
const DocumentPreview = ({
  doc,
  onDelete,
  isDeleting,
  isAdmin,
}: {
  doc: UserDoc;
  onDelete: (doc: UserDoc) => void;
  isDeleting: boolean;
  isAdmin: boolean;
}) => {
  const isReadOnly = doc.path.toLowerCase().includes("asset-report");

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold break-words">
            {doc.name.split("/").pop()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {doc.contentType ?? "unknown"} • {(doc.size / 1024).toFixed(1)} KB
          </p>
        </div>
        {!isAdmin && !isReadOnly && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(doc)}
            disabled={isDeleting}
          >
            <Trash2Icon className="h-5 w-5 text-red-500" />
          </Button>
        )}
      </div>

      {doc.contentType?.startsWith("image/") ? (
        <ImageZoom>
          <Image
            src={doc.signedUrl}
            alt={doc.name}
            className="w-full h-96 object-contain rounded-md border"
            width={500}
            height={500}
            unoptimized
          />
        </ImageZoom>
      ) : doc.contentType === "application/pdf" ? (
        <iframe
          src={doc.signedUrl}
          title={doc.name}
          className="w-full h-96 rounded-md border"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center justify-center h-96 bg-muted rounded-md">
          <p className="text-muted-foreground">Preview unavailable</p>
        </div>
      )}
    </div>
  );
};

export default function ClientDocuments({ userId }: { userId: string }) {
  const { role } = useAuth();
  const { userDocuments, isLoading, refetch } = useUserDocumentsQuery({
    userId,
  });
  const { deleteDocument, isDeleting } = useUserDocumentMutation();

  const [selectedDocType, setSelectedDocType] = useState<
    DocumentType | "OTHER"
  >(DOCUMENT_TYPES[0]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<UserDoc | null>(null);

  const isAdmin = role === "Admin";

  const { requiredDocsMap, otherDocs } = useMemo(() => {
    const requiredDocsMap = new Map<string, UserDoc>();
    const otherDocs: UserDoc[] = [];

    if (!userDocuments) {
      return { requiredDocsMap, otherDocs };
    }

    // --- THE FIX IS HERE ---
    userDocuments.forEach((doc) => {
      const fileName = doc.name.split("/").pop() || "";

      // Find the full document type that matches the start of the filename.
      // We check for `dt.id + '_'` to ensure we match the full ID and not just a partial one.
      const matchingDocType = DOCUMENT_TYPES.find((dt) =>
        fileName.startsWith(dt.id + "_")
      );

      if (matchingDocType) {
        // If a match is found, it's a required document.
        // Use the full, correct ID from the matching type.
        requiredDocsMap.set(matchingDocType.id, doc);
      } else {
        // If no match is found, it's an "other" document.
        otherDocs.push(doc);
      }
    });

    return { requiredDocsMap, otherDocs };
  }, [userDocuments]);

  const currentRequiredDocument = useMemo(() => {
    if (typeof selectedDocType === "string") return null;
    return requiredDocsMap.get(selectedDocType.id);
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

  // Find the specific document that matches the currently selected type
  // const currentDocument = useMemo(() => {
  //   return userDocuments?.find((doc) =>
  //     (doc.name.split("/").pop() || "").startsWith(selectedDocType.id)
  //   );
  // }, [userDocuments, selectedDocType]);

  if (isLoading) return <Spinner displayText="Loading documents..." />;

  return (
    <main className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
      {/* Left Panel: Document Type List */}
      <aside className="md:col-span-1 flex flex-col max-h-[calc(100vh-8rem)]">
        {" "}
        {/* 1. Set a max height and enable flexbox */}
        <h2 className="text-lg font-semibold px-3 flex-shrink-0">
          {" "}
          {/* 2. Keep the heading static */}
          Documents
        </h2>
        {/* 3. This div will contain all the scrollable items */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {DOCUMENT_TYPES.map((docType) => {
            const isUploaded = requiredDocsMap.has(docType.id);
            const isSelected =
              typeof selectedDocType !== "string" &&
              selectedDocType.id === docType.id;

            return (
              <button
                key={docType.id}
                onClick={() => setSelectedDocType(docType)}
                className={cn(
                  "w-full flex items-center text-left p-3 rounded-lg transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <docType.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="flex-grow">{docType.title}</span>
                {isUploaded ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </button>
            );
          })}

          <div className="pt-2">
            <button
              onClick={() => setSelectedDocType("OTHER")}
              className={cn(
                "w-full flex items-center text-left p-3 rounded-lg transition-colors",
                selectedDocType === "OTHER"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <FolderArchive className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="flex-grow">Other Documents</span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted-foreground text-background">
                {otherDocs.length}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Right Panel: Display or Upload */}
      <section className="md:col-span-2">
        {selectedDocType === "OTHER" ? (
          // --- View for "Other Documents" ---
          <div>
            {!isAdmin && <UploadFile userId={userId} />}
            <OtherDocumentsList
              docs={otherDocs}
              onDelete={handleOpenDeleteDialog}
              isDeleting={isDeleting}
              isAdmin={isAdmin}
            />
          </div>
        ) : // --- View for Required Documents ---
        currentRequiredDocument ? (
          <DocumentPreview
            doc={currentRequiredDocument}
            onDelete={handleOpenDeleteDialog}
            isDeleting={isDeleting}
            isAdmin={isAdmin}
          />
        ) : !isAdmin ? (
          <UploadFile userId={userId} documentType={selectedDocType} />
        ) : (
          <div className="flex items-center justify-center h-96 bg-muted rounded-md">
            <p className="text-muted-foreground">Document not uploaded yet.</p>
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
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
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

const OtherDocumentsList = ({
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
      <p className="text-sm text-muted-foreground mt-4 text-center">
        No other documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      <h4 className="font-semibold">Uploaded Other Documents</h4>
      {docs.map((doc) => (
        <div
          key={doc.path}
          className="flex items-center justify-between p-3 border rounded-md"
        >
          <div className="break-all">
            {/* --- THIS IS THE CHANGE --- */}
            <a
              href={doc.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:underline cursor-pointer"
            >
              {doc.name.split("/").pop()}
            </a>
            <p className="text-xs text-muted-foreground">
              {(doc.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {!isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(doc)}
              disabled={isDeleting}
            >
              <Trash2Icon className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

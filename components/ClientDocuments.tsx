"use client";

import Image from "next/image";
import Spinner from "@/components/Spinner";
import HeaderBox from "@/components/HeaderBox";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserDocumentMutation, useUserDocumentsQuery } from "@/hooks/document";
import { useAuth } from "@/provider/AuthContext";
import UploadFile from "@/app/(client)/my-documents/UploadFile";

export default function ClientDocuments({ userId }: { userId: string }) {
  const { user, role } = useAuth();
  const { userDocuments, isLoading, refetch } = useUserDocumentsQuery({ userId });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<UserDoc | null>(null);
  const { deleteDocument, isDeleting } = useUserDocumentMutation();

  const isAdmin = role === "Admin";

  function openInNewTab(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  const handleOpenDeleteDialog = (e: React.MouseEvent, doc: UserDoc) => {
    e.stopPropagation();
    setDocToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!docToDelete) return;

    await deleteDocument({ path: docToDelete.path });

    // After deletion, close the dialog and refetch the document list
    setIsDeleteDialogOpen(false);
    setDocToDelete(null);
    refetch(); // This will refresh the document list
  }, [docToDelete, refetch, deleteDocument]);

  if (!user) return null;

  if (isLoading) return <Spinner displayText="Loading documents..." />;

  return (
    <main className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {!isAdmin && <UploadFile />}
      {userDocuments?.map((doc) => (
        <article key={doc.path} className="rounded-2xl border shadow p-4">
          <div className="flex justify-between">
            <header className="mb-2 cursor-pointer" onClick={() => openInNewTab(doc.signedUrl)}>
              <h2 className="font-semibold break-words">{doc.name}</h2>
              <p className="text-sm opacity-70">
                {doc.contentType ?? "unknown"} • {(doc.size / 1024).toFixed(1)} KB
              </p>
            </header>
            {!doc.path.toLowerCase().includes("crs") &&
              !isAdmin &&
              !doc.path.toLowerCase().includes("asset-report") && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="cursor-pointer"
                  onClick={(e) => handleOpenDeleteDialog(e, doc)}
                >
                  <Trash2Icon className="h-4 w-4" color="red" />
                </Button>
              )}
          </div>

          {doc.contentType?.startsWith("image/") ? (
            <ImageZoom>
              <Image
                src={doc.signedUrl}
                alt={doc.name}
                className="w-full h-64 object-cover rounded-lg"
                width={500}
                unoptimized
                height={500}
              />
            </ImageZoom>
          ) : doc.contentType === "application/pdf" ? (
            <div className="relative">
              <iframe
                src={doc.signedUrl}
                title={doc.name}
                className="w-full h-64 rounded-lg"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="text-sm opacity-70">Preview unavailable</div>
          )}
        </article>
      ))}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file
              <span className="font-bold block mt-2 break-all">{docToDelete?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Yes, Delete File"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { GET_USER_DOCUMENTS } from "@/constant/react-query-keys";
import { DocumentType } from "@/lib/document-types";
import { useAuth } from "@/provider/AuthContext";
import { UploadedFileData } from "@/service/documents";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";

// The component now needs to know what it's uploading
type UploadFileProps = {
  userId: string;
  documentType?: DocumentType;
};

const UploadFile = ({ userId, documentType }: UploadFileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (!droppedFiles || droppedFiles.length === 0) return;

      setIsLoading(true);

      const formData = new FormData();
      formData.append("userId", userId);
      // **CRUCIAL CHANGE**: Tell the backend the type of document being uploaded.
      if (documentType) {
        formData.append("documentType", documentType.id);
      }

      // We'll upload one file at a time for a specific document type
      formData.append("file", droppedFiles[0]);

      try {
        // The API endpoint remains the same, but the backend handler will use the `documentType`
        const response = await fetch(`/api/user/${userId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Upload failed");
        }

        // Invalidate queries to refetch the document list
        queryClient.invalidateQueries({
          queryKey: [GET_USER_DOCUMENTS, userId],
        });
      } catch (error: any) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, documentType, queryClient]
  );

  const title = documentType
    ? `Upload: ${documentType.title}`
    : "Upload Other Document";
  const description = documentType
    ? documentType.description
    : "Upload any additional documents required for your application.";

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <Dropzone
        className="cursor-pointer"
        maxFiles={1} // Only one file per document type
        onDrop={handleDrop}
        disabled={isLoading}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  );
};

export default UploadFile;

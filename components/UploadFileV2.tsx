// upload-file.tsx

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { GET_USER_DOCUMENTS } from "@/constant/react-query-keys";
import { DocumentType } from "@/lib/document-types";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React, { useCallback, useState } from "react";

// The component now needs to know what it's uploading
type UploadFileProps = {
  userId: string;
  documentType?: DocumentType;
  onUploadComplete?: (files: File[]) => void;
  titleOverride?: string;
  descriptionOverride?: string;
};

const UploadFile = ({
  userId,
  documentType,
  onUploadComplete,
  titleOverride,
  descriptionOverride,
}: UploadFileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (!droppedFiles || droppedFiles.length === 0) return;

      const validFiles = droppedFiles.filter(
        (f) => f.type === "application/pdf" || f.type.startsWith("image/"),
      );

      if (validFiles.length === 0) {
        return;
      }

      setIsLoading(true);

      const formData = new FormData();
      formData.append("userId", userId);
      // **CRUCIAL CHANGE**: Tell the backend the type of document being uploaded.
      if (documentType) {
        formData.append("documentType", documentType.id);
      }

      // Append all dropped files to the form data
      validFiles.forEach((file) => {
        formData.append("files", file);
      });

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

        if (onUploadComplete) {
          onUploadComplete(validFiles);
        }
      } catch (error: any) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, documentType, queryClient, onUploadComplete],
  );

  const title =
    titleOverride ||
    (documentType ? `Upload: ${documentType.title}` : "Upload Other Document");
  const description =
    descriptionOverride ||
    (documentType
      ? `${documentType.description} (PDF or Image only)`
      : "Upload any additional documents required for your application. (PDF or Image only)");

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 mb-8 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            Uploading Document...
          </span>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <Dropzone
        maxFiles={3}
        className="cursor-pointer"
        onDrop={handleDrop}
        disabled={isLoading}
        accept={{
          "application/pdf": [".pdf"],
          "image/*": [".png", ".jpg", ".jpeg", ".gif"],
        }}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  );
};

export default UploadFile;

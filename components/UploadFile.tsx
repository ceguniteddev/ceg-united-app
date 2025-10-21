import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { GET_USER_DOCUMENTS } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { UploadedFileData } from "@/service/documents";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

const UploadFile = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadedFileData[] | null>(null);
  const queryClient = useQueryClient();
  const handleDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (!droppedFiles || droppedFiles.length === 0) return;

      setFiles(droppedFiles);
      setIsLoading(true);
      setUploadError(null);
      setUploadResult(null);

      // Create a FormData object to send the files
      const formData = new FormData();
      formData.append("userId", user?.uid || "");
      droppedFiles.forEach((file) => {
        // Use the same key ("files") for all files
        formData.append("files", file);
      });

      try {
        const response = await fetch(`/api/user/${user?.uid}/documents`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        setUploadResult(result.data);
        queryClient.invalidateQueries({
          queryKey: [GET_USER_DOCUMENTS, user?.uid],
        });
      } catch (error: any) {
        setUploadError(error.message);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, queryClient]
  );

  if (!user) return null;

  return (
    <Dropzone
      maxFiles={3}
      onDrop={handleDrop}
      onError={(error) => {
        toast.error(error.message);
      }}
      disabled={isLoading}
      src={files}
    >
      <DropzoneEmptyState />
      <DropzoneContent />
    </Dropzone>
  );
};

export default UploadFile;

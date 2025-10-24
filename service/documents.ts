"use server";

import { storageAdmin } from "@/lib/fireabase-admin";

// The shape of the returned data remains the same
export interface UploadedFileData {
  originalFilename: string;
  gcsPath: string;
  size: number;
  contentType: string;
}

/**
 * Uploads a single document for a specific user and document type.
 * It will first delete any existing documents of the same type for that user.
 *
 * @param userId - The ID of the user.
 * @param file - A single File object.
 * @param documentType - The category of the document (e.g., "DRIVERS_LICENSE").
 * @returns A promise that resolves to the details of the uploaded file.
 */
export const uploadDocument = async (
  userId: string,
  file: File,
  documentType: string | null // <-- Now optional
): Promise<UploadedFileData> => {
  const bucket = storageAdmin();
  const userDocumentPrefix = `documents/${userId}/`;
  let newFilename: string;

  // console.log("uploadDocument", { userId, file, documentType });

  // --- Branching Logic ---
  if (documentType) {
    // CATEGORIZED UPLOAD LOGIC (delete old, use structured name)
    const oldFilesPrefix = `${userDocumentPrefix}${documentType}_`;
    const [oldFiles] = await bucket.getFiles({ prefix: oldFilesPrefix });
    if (oldFiles.length > 0) {
      const deletePromises = oldFiles.map((oldFile) => oldFile.delete());
      await Promise.all(deletePromises);
    }
    const extension = file.name.split(".").pop() || "bin";
    newFilename = `${documentType}_${Date.now()}.${extension}`;
  } else {
    // UNCATEGORIZED ("OTHER") UPLOAD LOGIC
    // Sanitize the original filename and make it unique to prevent conflicts.
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    newFilename = `${Date.now()}_${sanitizedName}`;
  }

  const path = `${userDocumentPrefix}${newFilename}`;

  // --- Upload Logic (same for both branches) ---
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blob = bucket.file(path);
  await blob.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  // console.log(`Successfully uploaded ${path}`);

  return {
    originalFilename: file.name,
    gcsPath: path,
    size: file.size,
    contentType: file.type,
  };
};

/**
 * Deletes a single document from Google Cloud Storage based on its full path.
 */
export const deleteDocument = async (path: string) => {
  try {
    const bucket = storageAdmin();
    const blob = bucket.file(path);
    await blob.delete();
    console.log(`Successfully deleted document: ${path}`);
  } catch (error: any) {
    // It's often safe to ignore "Not Found" errors during deletion
    if (error.code === 404) {
      console.warn(
        `Attempted to delete a document that does not exist: ${path}`
      );
      return;
    }
    console.error(`Failed to delete document ${path}:`, error);
    // Re-throw the error if it's not a 404, so the mutation hook knows it failed
    throw error;
  }
};

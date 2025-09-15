"use server";
import { storageAdmin } from "@/lib/fireabase-admin"; // Your existing admin instance
import { randomUUID } from "crypto";

// Define the shape of the data returned after a successful upload
export interface UploadedFileData {
  originalFilename: string;
  gcsPath: string;
  size: number;
  contentType: string;
}

/**
 * Uploads an array of files to Google Cloud Storage for a specific user.
 *
 * @param userId - The ID of the user to associate the files with.
 * @param files - An array of File objects received from a FormData request.
 * @returns A promise that resolves to an array of objects containing upload details.
 */
export const uploadDocuments = async (
  userId: string,
  files: File[]
): Promise<UploadedFileData[]> => {
  const bucket = storageAdmin();
  const prefix = `documents/${userId}/`;

  // Use Promise.all to handle all file uploads concurrently for better performance.
  const uploadPromises = files.map(async (file) => {
    // The File object from the browser is not directly usable on the server.
    // We first need to get its content as an ArrayBuffer.
    const arrayBuffer = await file.arrayBuffer();
    // Then convert the ArrayBuffer into a Node.js Buffer, which the Admin SDK expects.
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename to prevent overwrites and add security.
    const uniqueId = randomUUID();
    const filename = file.name;
    const path = `${prefix}${filename}`;

    // Get a reference to the file object in GCS
    const blob = bucket.file(path);

    // Upload the buffer to GCS
    await blob.save(buffer, {
      metadata: {
        contentType: file.type, // Set the content type for proper browser handling
      },
    });

    // Return the essential details for this uploaded file
    return {
      originalFilename: file.name,
      gcsPath: path,
      size: file.size,
      contentType: file.type,
    };
  });

  // Wait for all the individual uploads to complete
  const uploadedFiles = await Promise.all(uploadPromises);

  return uploadedFiles;
};

export const deleteDocument = async (path: string) => {
  const bucket = storageAdmin();
  const blob = bucket.file(path);
  await blob.delete();
};

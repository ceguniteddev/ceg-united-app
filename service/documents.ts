"use server";

import { storageAdmin, firestoreAdmin } from "@/lib/fireabase-admin";

import { UploadedFileData } from "@/schema";
import { headers } from "next/headers";
import { getCurrentUser } from "./user";

// The shape of the returned data remains the same

/**
 * Extracts the client IP address from request headers.
 * Checks multiple headers in order of preference.
 * Supports both IPv4 and IPv6 addresses.
 */
const getClientIP = async (): Promise<string> => {
  const headersList = await headers();

  let ipAddress: string | null = null;

  // Check x-forwarded-for first (most common behind proxies/load balancers)
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first IP
    ipAddress = forwarded.split(",")[0].trim();
  }

  // Check x-real-ip (used by nginx)
  if (!ipAddress) {
    const realIp = headersList.get("x-real-ip");
    if (realIp) ipAddress = realIp;
  }

  // Check x-client-ip
  if (!ipAddress) {
    const clientIp = headersList.get("x-client-ip");
    if (clientIp) ipAddress = clientIp;
  }

  // If no IP found, return unknown
  if (!ipAddress) return "unknown";

  // Clean and normalize the IP address
  // Remove port if present (e.g., "192.168.1.1:8080" -> "192.168.1.1")
  ipAddress =
    ipAddress.split(":").length > 2
      ? ipAddress // Keep IPv6 as is (has multiple colons)
      : ipAddress.split(":")[0]; // Remove port from IPv4

  // Add IP version indicator for metadata
  // const isIPv6 = ipAddress.includes(":");
  // const ipVersion = isIPv6 ? "IPv6" : "IPv4";

  return ipAddress;
};

/**
 * Uploads a single document for a specific user and document type.
 * It will first delete any existing documents of the same type for that user.
 *
 * @param userId - The ID of the user.
 * @param file - A single File object.
 * @param documentType - The category of the document (e.g., "DRIVERS_LICENSE").
 * @param customMetadata - Optional custom metadata to attach to the file.
 * @returns A promise that resolves to the details of the uploaded file.
 */
export const uploadDocument = async ({
  userId,
  file,
  documentType,
  customMetadata,
}: {
  userId: string;
  file: File;
  documentType: string | null; // <-- Now optional
  customMetadata?: Record<string, string>; // <-- Optional metadata parameter}
}): Promise<UploadedFileData> => {
  const bucket = storageAdmin();
  const userDocumentPrefix = `documents/${userId}/`;
  let newFilename: string;

  // console.log("uploadDocument", { userId, file, documentType });

  // --- Branching Logic ---
  if (documentType) {
    // CATEGORIZED UPLOAD LOGIC (delete old, use structured name)
    // const oldFilesPrefix = `${userDocumentPrefix}${documentType}_`;
    // const [oldFiles] = await bucket.getFiles({ prefix: oldFilesPrefix });
    // if (oldFiles.length > 0) {
    //   const deletePromises = oldFiles.map((oldFile) => oldFile.delete());
    //   await Promise.all(deletePromises);
    // }
    // const extension = file.name.split(".").pop() || "bin";
    const sanitizedName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_");
    newFilename = `${documentType}_${Date.now()}_${sanitizedName}`;
  } else {
    // UNCATEGORIZED ("OTHER") UPLOAD LOGIC
    // Sanitize the original filename and make it unique to prevent conflicts.
    const sanitizedName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_");
    newFilename = `${Date.now()}_${sanitizedName}`;
  }

  const path = `${userDocumentPrefix}${newFilename}`;

  // Check if current user is Admin to skip IP recording
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "Admin";

  // Capture client IP address only if not Admin
  const clientIP = isAdmin ? undefined : await getClientIP();
  // logInfo("uploadDocument", { userId, documentType, clientIP, customMetadata });

  // --- Upload Logic (same for both branches) ---
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blob = bucket.file(path);

  await blob.save(buffer, {
    metadata: {
      metadata: {
        contentType: file.type,
        ...(clientIP && { clientIP }), // Only include clientIP if not Admin
        ...customMetadata,
      },
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
        `Attempted to delete a document that does not exist: ${path}`,
      );
      return;
    }
    console.error(`Failed to delete document ${path}:`, error);
    // Re-throw the error if it's not a 404, so the mutation hook knows it failed
    throw error;
  }
};

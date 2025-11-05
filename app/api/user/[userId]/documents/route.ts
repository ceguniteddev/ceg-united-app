import { withAuth } from "@/lib/api-validation";
import { uploadDocument } from "@/service/documents";
import { NextRequest, NextResponse } from "next/server";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getUserDocuments } from "@/service/user";
import AppError from "@/error/AppError";

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string; businessId: string }> }
  ) => {
    try {
      const formData = await request.formData();
      const { userId } = (await params) ?? {};

      // --- MODIFICATION: Handle multiple files ---
      // Use `getAll` to retrieve all files associated with the "files" key
      const files = formData.getAll("files") as File[];
      const documentType = formData.get("documentType") as string | null;

      // --- Validation ---
      if (!userId) {
        return badRequest({ errors: "User ID is missing." });
      }
      // Check if the files array is empty
      if (!files || files.length === 0) {
        return badRequest({ errors: "No files were uploaded." });
      }
      // If a documentType is provided, validate it.
      if (
        documentType &&
        !DOCUMENT_TYPES.some((dt) => dt.id === documentType)
      ) {
        return badRequest({ errors: "Invalid document type provided." });
      }
      // --- End Validation ---

      // --- MODIFICATION: Upload all files concurrently ---
      // Create an array of upload promises
      const uploadPromises = files.map((file) =>
        uploadDocument(userId, file, documentType)
      );

      // Wait for all promises to resolve
      const uploadedFilesData = await Promise.all(uploadPromises);

      return NextResponse.json(
        {
          message: "Files uploaded successfully!",
          data: uploadedFilesData, // The data is now an array of uploaded file info
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error handling file upload:", error);
      return internalServerError();
    }
  }
);

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing User ID" });
    }

    try {
      const data = await getUserDocuments({ userId });

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);

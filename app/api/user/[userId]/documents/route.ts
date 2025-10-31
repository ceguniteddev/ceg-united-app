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

      const file = formData.get("file") as File | null;
      // documentType is now optional
      const documentType = formData.get("documentType") as string | null;

      // --- Validation ---
      if (!userId) {
        return badRequest({ errors: "User ID is missing." });
      }
      if (!file) {
        return badRequest({ errors: "No file was uploaded." });
      }
      // If a documentType is provided, validate it. If not, that's okay.
      if (
        documentType &&
        !DOCUMENT_TYPES.some((dt) => dt.id === documentType)
      ) {
        return badRequest({ errors: "Invalid document type provided." });
      }
      // --- End Validation ---

      const uploadedFileData = await uploadDocument(userId, file, documentType);

      return NextResponse.json(
        {
          message: "File uploaded successfully!",
          data: uploadedFileData,
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

import { withAuth } from "@/lib/api-validation";
import { uploadDocuments } from "@/service/documents";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const formData = await request.formData();

    const userId = formData.get("userId") as string | null;
    const files = formData.getAll("files") as File[] | null;

    // --- Validation ---
    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
    }
    // --- End Validation ---

    // Call the server-side service function to handle the upload logic
    const uploadedFilesData = await uploadDocuments(userId, files);

    return NextResponse.json(
      {
        message: "Files uploaded successfully!",
        data: uploadedFilesData,
      },
      { status: 201 } // 201 Created is a good status code for successful uploads
    );
  } catch (error) {
    console.error("Error handling file upload:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload." },
      { status: 500 }
    );
  }
});

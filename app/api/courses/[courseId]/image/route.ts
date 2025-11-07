import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getUserDocuments } from "@/service/user";
import AppError from "@/error/AppError";
import { uploadCourseDocument } from "@/service/educational-materials/course";

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    try {
      const formData = await request.formData();
      const { courseId } = (await params) ?? {};

      if (!courseId) {
        return badRequest({ errors: "Course ID is missing." });
      }

      const files = formData.getAll("files") as File[];

      if (!files || files.length === 0) {
        return badRequest({ errors: "No files were uploaded." });
      }

      const uploadPromises = files.map((file) =>
        uploadCourseDocument({ courseId, file })
      );

      // Wait for all promises to resolve
      const uploadedFilesData = await Promise.all(uploadPromises);
      return NextResponse.json(
        {
          message: "Files uploaded successfully!",
          data: uploadedFilesData,
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

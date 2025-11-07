import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { uploadCourseAttachment } from "@/service/educational-materials/course";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    try {
      const { courseId } = (await params) ?? {};

      if (!courseId) {
        return badRequest({ errors: "Course ID is missing." });
      }
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];

      if (!files || files.length === 0) {
        return badRequest({ errors: "No files were uploaded." });
      }

      const uploadPromises = files.map((file) =>
        uploadCourseAttachment({ courseId, file })
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
      console.error("[POST COURSE_ATTACHMENTS]", error);
      return internalServerError();
    }
  }
);

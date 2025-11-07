import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import {
  deleteAttachment,
  deleteCourseDocument,
  getAttachmentById,
} from "@/service/educational-materials/course";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ courseId: string; attachmentId: string }> }
  ) => {
    try {
      const { courseId, attachmentId } = (await params) ?? {};

      if (!courseId) {
        return badRequest({ errors: "Course ID is missing." });
      }

      if (!attachmentId) {
        return badRequest({ errors: "Attachment ID is missing." });
      }

      const data = await getAttachmentById({ courseId, attachmentId });

      if (!data) {
        return badRequest({ errors: "Attachment not found." });
      }

      await deleteCourseDocument(data.url);
      await deleteAttachment({ courseId, attachmentId });

      return NextResponse.json("Success", { status: 200 });
    } catch (error) {
      console.error("[POST COURSE_ATTACHMENTS]", error);
      return internalServerError();
    }
  }
);

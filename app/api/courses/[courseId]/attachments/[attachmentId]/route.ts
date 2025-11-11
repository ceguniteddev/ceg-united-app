import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import {
  deleteAttachment,
  deleteCourseDocument,
  getAttachmentById,
} from "@/service/educational-materials/course";
import { storageAdmin } from "@/lib/fireabase-admin";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ courseId: string; attachmentId: string }> }
  ) => {
    const { courseId, attachmentId } = (await params) ?? {};

    if (!courseId || !attachmentId) {
      return NextResponse.json(
        { error: "Missing courseId or attachmentId" },
        { status: 400 }
      );
    }

    try {
      // Get attachment metadata from Firestore
      const attachment = await getAttachmentById({ courseId, attachmentId });

      if (!attachment || !attachment.url) {
        return NextResponse.json(
          { error: "Attachment not found" },
          { status: 404 }
        );
      }

      // Get file from Firebase Storage
      const bucket = storageAdmin();
      const file = bucket.file(attachment.url);

      // Generate a signed URL and redirect to it
      // This is more efficient than proxying the entire file
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to the signed URL
      return NextResponse.redirect(signedUrl);
    } catch (error: any) {
      console.error("Error fetching attachment:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch attachment" },
        { status: 500 }
      );
    }
  }
);

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

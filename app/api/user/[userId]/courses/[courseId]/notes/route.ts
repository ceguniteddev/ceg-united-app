import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  getCourseNotes,
  saveCourseNote,
  deleteCourseNote,
} from "@/service/educational-materials/course";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string; courseId: string }> },
  ) => {
    try {
      const { userId, courseId } = (await params) ?? {};
      if (!userId || !courseId) {
        return badRequest({ errors: "Missing userId or courseId" });
      }

      const notes = await getCourseNotes({ userId, courseId });
      return NextResponse.json({ notes });
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to fetch notes");
    }
  },
);

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string; courseId: string }> },
  ) => {
    try {
      const { userId, courseId } = (await params) ?? {};
      if (!userId || !courseId) {
        return badRequest({ errors: "Missing userId or courseId" });
      }

      const body = await req.json();
      const { id, chapterId, timestampSeconds, content } = body;

      if (!chapterId || content == null) {
        return badRequest({ errors: "Chapter ID and content are required" });
      }

      const note = await saveCourseNote({
        id,
        userId,
        courseId,
        chapterId,
        timestampSeconds: Number(timestampSeconds) || 0,
        content,
      });

      return NextResponse.json({ note });
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to save note");
    }
  },
);

export const DELETE = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string; courseId: string }> },
  ) => {
    try {
      const { searchParams } = new URL(req.url);
      const noteId = searchParams.get("noteId");
      if (!noteId) {
        return badRequest({ errors: "Missing noteId parameter" });
      }

      await deleteCourseNote(noteId);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to delete note");
    }
  },
);

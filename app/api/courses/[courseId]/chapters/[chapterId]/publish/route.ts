import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import {
  getChapterById,
  updateCourseChapter,
} from "@/service/educational-materials/chapter";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ courseId: string; chapterId: string }> }
  ) => {
    const { courseId, chapterId } = (await params) ?? {};
    if (!courseId) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }
    if (!chapterId) {
      return NextResponse.json(
        { error: "Missing chapter id" },
        { status: 400 }
      );
    }

    try {
      const chapter = await getChapterById(courseId, chapterId);
      if (!chapter) return badRequest({ errors: "Chapter not found." });

      if (
        !chapter ||
        !chapter.muxData ||
        !chapter.title ||
        !chapter.description ||
        !chapter.videoUrl
      ) {
        return new NextResponse("Missing required fields", { status: 400 });
      }

      const response = await updateCourseChapter({
        courseId,
        chapterId,
        data: {
          isPublished: true,
        },
      });
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.log("[CHAPTER_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

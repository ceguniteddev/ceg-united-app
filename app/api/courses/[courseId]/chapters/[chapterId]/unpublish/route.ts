import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import {
  getChapterById,
  updateCourseChapter,
} from "@/service/educational-materials/chapter";
import { getCourseById } from "@/service/educational-materials/course";
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

      const response = await updateCourseChapter({
        courseId,
        chapterId,
        data: {
          isPublished: false,
        },
      });

      const course = await getCourseById(courseId);
      const hasPublishedChapters = course?.chapters?.some(
        (chapter) => chapter.isPublished === true
      );

      if (!hasPublishedChapters) {
        await updateCourseChapter({
          courseId,
          chapterId,
          data: { isPublished: false },
        });
      }

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.log("[CHAPTER_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

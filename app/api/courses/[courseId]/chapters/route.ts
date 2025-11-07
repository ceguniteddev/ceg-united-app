import { withAuth } from "@/lib/api-validation";
import {
  getChaptersByCourseId,
  recordChapterTitle,
} from "@/service/educational-materials/chapter";
import { NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: Request,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    const { courseId } = (await params) ?? {};
    try {
      const { title } = await req.json();

      let position = 1;
      const chapters = await getChaptersByCourseId(courseId!);
      if (chapters) {
        position = chapters[chapters.length - 1].position + 1;
      }
      const chapter = await recordChapterTitle({
        title,
        courseId: courseId!,
        position,
      });

      return NextResponse.json(chapter);
    } catch (error) {
      console.log("[CHAPTERS]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

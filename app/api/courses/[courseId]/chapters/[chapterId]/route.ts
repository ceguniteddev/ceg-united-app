import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { deleteMuxVideo } from "@/lib/mux";
import {
  deleteChapter,
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
      const values = await req.json();
      const response = await updateCourseChapter({
        courseId,
        chapterId,
        data: values,
      });
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.log("[CHAPTER_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

export const POST = withAuth(
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

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return badRequest({ errors: "No files were uploaded." });
    }
    try {
      return NextResponse.json("Success", { status: 200 });
    } catch (error) {
      console.log("[CHAPTER_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

export const DELETE = withAuth(
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
      // delete muxData
      const chapter = await getChapterById(courseId, chapterId);
      if (!chapter) return badRequest({ errors: "Chapter not found." });

      if (chapter.videoUrl) {
        if (chapter.muxData?.assetId) {
          await deleteMuxVideo(chapter.muxData?.assetId);
        }
      }

      await deleteChapter(courseId, chapterId);

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

      return NextResponse.json("Success", { status: 200 });
    } catch (error) {
      console.log("[CHAPTER_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

import { withAuth } from "@/lib/api-validation";
import {
  deleteCourse,
  getCourseById,
  updateCourse,
} from "@/service/educational-materials/course";
import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "../../helpers";
import { deleteMuxVideo } from "@/lib/mux";
import { revalidateTag } from "next/cache";

export const PATCH = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    const { courseId } = (await params) ?? {};
    if (!courseId) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }
    try {
      const values = await req.json();
      console.log("VALUES", values);
      const response = await updateCourse({ id: courseId, data: values });
      revalidateTag(`course:${courseId}`, "max");
      revalidateTag("courses", "max");
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.log("[COURSE_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    const { courseId } = (await params) ?? {};
    if (!courseId) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }
    try {
      const response = await getCourseById(courseId);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.log("[COURSE_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

export const DELETE = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    const { courseId } = (await params) ?? {};
    if (!courseId) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }

    try {
      const course = await getCourseById(courseId);
      if (!course) return badRequest({ errors: "Course not found." });

      if (course && course.chapters) {
        for (const chapter of course.chapters) {
          if (chapter.muxData?.assetId) {
            await deleteMuxVideo(chapter.muxData?.assetId);
          }
        }
      }

      await deleteCourse(courseId);

      revalidateTag(`course:${courseId}`, "max");
      revalidateTag("courses", "max");

      return NextResponse.json("Success", { status: 200 });
    } catch (error) {
      console.log("[COURSE_ID_DELETE]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

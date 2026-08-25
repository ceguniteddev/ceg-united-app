import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  getSectionsByCourseId,
  createCourseSection,
} from "@/service/educational-materials/course";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) => {
  try {
    const { courseId } = (await params) ?? {};
    if (!courseId) return badRequest({ errors: "Missing course ID" });

    const sections = await getSectionsByCourseId(courseId);
    return NextResponse.json({ sections: sections || [] });
  } catch (error: any) {
    return internalServerError(error?.message || "Failed to fetch sections");
  }
};

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> },
  ) => {
    try {
      const { courseId } = (await params) ?? {};
      if (!courseId) return badRequest({ errors: "Missing course ID" });

      const body = await req.json();
      const { title, description, position } = body;

      if (!title) {
        return badRequest({ errors: "Section title is required" });
      }

      const section = await createCourseSection({
        courseId,
        title,
        description,
        position: position ?? 0,
      });

      return NextResponse.json(section);
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to create section");
    }
  },
);

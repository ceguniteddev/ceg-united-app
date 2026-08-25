import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  updateCourseSection,
  deleteCourseSection,
} from "@/service/educational-materials/course";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const PATCH = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string; sectionId: string }> },
  ) => {
    try {
      const { courseId, sectionId } = (await params) ?? {};
      if (!courseId || !sectionId) {
        return badRequest({ errors: "Missing course or section ID" });
      }

      const body = await req.json();
      const updated = await updateCourseSection({
        courseId,
        sectionId,
        data: body,
      });

      return NextResponse.json(updated);
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to update section");
    }
  },
);

export const DELETE = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string; sectionId: string }> },
  ) => {
    try {
      const { courseId, sectionId } = (await params) ?? {};
      if (!courseId || !sectionId) {
        return badRequest({ errors: "Missing course or section ID" });
      }

      await deleteCourseSection({ courseId, sectionId });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to delete section");
    }
  },
);

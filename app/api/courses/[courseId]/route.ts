import { withAuth } from "@/lib/api-validation";
import { updateCourse } from "@/service/educational-materials/course";
import { NextRequest, NextResponse } from "next/server";

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
      const response = await updateCourse({ id: courseId, data: values });
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.log("[COURSE_ID_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

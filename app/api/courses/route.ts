import { withAuth } from "@/lib/api-validation";
import {
  getCourses,
  recordCourseTitle,
} from "@/service/educational-materials/course";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { title } = await req.json();

    const response = await recordCourseTitle(title);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.log("[COURSES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const GET = withAuth(async () => {
  try {
    const response = await getCourses();
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log("[COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

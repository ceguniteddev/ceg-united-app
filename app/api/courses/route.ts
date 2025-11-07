import { withAuth } from "@/lib/api-validation";
import { recordCourseTitle } from "@/service/educational-materials/course";
import { NextRequest, NextResponse } from "next/server";

import { revalidateTag } from "next/cache";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { title } = await req.json();
    const response = await recordCourseTitle(title);
    revalidateTag("courses");
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.log("[COURSES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

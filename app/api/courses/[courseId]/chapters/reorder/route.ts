import { withAuth } from "@/lib/api-validation";
import { updateChapter } from "@/service/educational-materials/chapter";

import { NextResponse } from "next/server";

export const PUT = withAuth(
  async (
    req: Request,
    { params }: { params?: Promise<{ courseId: string }> }
  ) => {
    const { courseId } = (await params) ?? {};
    if (!courseId) {
      return new NextResponse("Missing course id", { status: 400 });
    }
    try {
      const { list } = await req.json();

      for (const item of list) {
        await updateChapter({
          courseId: courseId!,
          id: item.id,
          data: { position: item.position },
        });
      }

      return new NextResponse("Success", { status: 200 });
    } catch (error) {
      console.log("[CHAPTERS]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
);

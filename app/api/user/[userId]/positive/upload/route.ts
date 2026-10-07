import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { uploadPositiveDocumentFile } from "@/service/positive";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const enrollmentId = formData.get("enrollmentId") as string | null;

      if (!file || !enrollmentId) {
        return badRequest({ errors: "Missing file or enrollmentId" });
      }

      if (file.size > 10 * 1024 * 1024) {
        return badRequest({ errors: "File size exceeds 10MB limit" });
      }

      const result = await uploadPositiveDocumentFile({
        userId,
        enrollmentId,
        file,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
      console.error("Error in POST positive document upload:", err);
      return internalServerError();
    }
  },
);

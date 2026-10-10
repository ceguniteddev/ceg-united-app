import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { uploadDisputeFile } from "@/service/disputes";

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
      const kind = (formData.get("kind") as "evidence" | "response" | "case") || "evidence";
      const itemId = (formData.get("itemId") as string) || undefined;
      const lineId = (formData.get("lineId") as string) || undefined;

      if (!file) {
        return badRequest({ errors: "Missing file" });
      }

      if (file.size > 25 * 1024 * 1024) {
        return badRequest({ errors: "File size exceeds 25MB limit" });
      }

      const result = await uploadDisputeFile({
        userId,
        kind,
        file,
        meta: { itemId, lineId },
      });

      return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
      console.error("Error in POST dispute upload:", err);
      return internalServerError();
    }
  },
);

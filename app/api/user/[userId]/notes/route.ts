import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getUserNote, updateUserNote } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

// Handler for GET requests
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }
      const noteData = await getUserNote(userId);
      return NextResponse.json(noteData);
    } catch (error: any) {
      console.error("GET /api/user-notes Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);

// Handler for POST requests (for updating)
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      const body = await request.json();

      await updateUserNote({ userId, note: body });

      return NextResponse.json({ message: "Note updated successfully" });
    } catch (error: any) {
      console.error("POST /api/user-notes Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);

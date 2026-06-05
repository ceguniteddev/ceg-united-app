import { NextRequest, NextResponse } from "next/server";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";

/**
 * GET /api/user/[userId]/disputes
 * Get all disputes for the specified user
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const resolvedParams = params ? await params : undefined;
      const userId = resolvedParams?.userId;

      if (!userId) {
        return badRequest({ errors: "User ID is required" });
      }

      const db = firestoreAdmin();
      const snapshot = await db
        .collection("disputes")
        .where("userId", "==", userId)
        .get();

      const disputes = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json(disputes, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get disputes:", error);
      return internalServerError("Failed to get disputes");
    }
  },
);

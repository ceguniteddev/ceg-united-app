import { NextRequest, NextResponse } from "next/server";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { normalizeAllDates } from "@/lib/date-parser";

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

      const disputes = await Promise.all(
        snapshot.docs.map(async (doc: any) => {
          const data = doc.data();
          const generatedLettersSnapshot = await doc.ref
            .collection("generatedLetters")
            .get();
          const generatedLetters: Record<string, any> = {};

          generatedLettersSnapshot.docs.forEach((letterDoc: any) => {
            generatedLetters[letterDoc.id] = letterDoc.data();
          });

          return normalizeAllDates({
            id: doc.id,
            ...data,
            generatedLetters,
          });
        }),
      );

      return NextResponse.json(disputes, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get disputes:", error);
      return internalServerError("Failed to get disputes");
    }
  },
);

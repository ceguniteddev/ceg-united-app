import { NextRequest, NextResponse } from "next/server";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { normalizeAllDates } from "@/lib/date-parser";
import { PSF_INVOICES_COLLECTION } from "@/constant/collection-name";

/**
 * GET /api/user/[userId]/psf-invoices
 * Retrieve all PSF success fee invoices for a user sorted by createdAt desc
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
        .collection(PSF_INVOICES_COLLECTION)
        .where("userId", "==", userId)
        .get();

      const invoices = snapshot.docs.map((doc) => {
        return normalizeAllDates({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by createdAt desc in memory to avoid missing Firestore index errors
      invoices.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      return NextResponse.json(invoices, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get PSF invoices:", error);
      return internalServerError("Failed to get PSF invoices");
    }
  },
);

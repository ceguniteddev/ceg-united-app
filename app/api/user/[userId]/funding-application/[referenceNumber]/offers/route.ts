import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_FUNDING_APPLICATION } from "@/constant/collection-name";

export const POST = withAuth(
  async (
    request: NextRequest,
    {
      params,
    }: { params?: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const referenceNumber = resolvedParams?.referenceNumber;

      if (!referenceNumber) {
        return badRequest({ errors: "Reference Number is required" });
      }

      const body = await request.json();
      const { offers } = body;

      if (!Array.isArray(offers)) {
        return badRequest({ errors: "Offers must be an array" });
      }

      const db = firestoreAdmin();
      const docRef = db
        .collection(USER_FUNDING_APPLICATION)
        .doc(referenceNumber);

      await docRef.set({ offers }, { merge: true });

      return NextResponse.json(
        { message: "Offers updated successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error updating offers:", error);
      return internalServerError();
    }
  },
);

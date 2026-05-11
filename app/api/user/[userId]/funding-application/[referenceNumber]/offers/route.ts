import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_FUNDING_APPLICATION } from "@/constant/collection-name";
import { FieldValue } from "firebase-admin/firestore";

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
      const { offers, append } = body;

      if (!Array.isArray(offers)) {
        return badRequest({ errors: "Offers must be an array" });
      }

      // Ensure every offer has an ID before saving to the database
      const processedOffers = offers.map((offer: any) => {
        if (!offer.id) {
          return {
            ...offer,
            id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
        }
        return offer;
      });

      const db = firestoreAdmin();
      const docRef = db
        .collection(USER_FUNDING_APPLICATION)
        .doc(referenceNumber);

      if (append) {
        if (processedOffers.length === 0) {
          return NextResponse.json(
            { message: "No offers to append" },
            { status: 200 },
          );
        }
        await docRef.set(
          {
            offers: FieldValue.arrayUnion(...processedOffers),
          },
          { merge: true },
        );
      } else {
        await docRef.set({ offers: processedOffers }, { merge: true });
      }

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

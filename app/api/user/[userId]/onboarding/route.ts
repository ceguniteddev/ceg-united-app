import { NextRequest, NextResponse } from "next/server";
import { documentUploadSchema } from "@/schema/new-registration";
import { withAuth } from "@/lib/api-validation";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { badRequest } from "@/app/api/helpers";
import {
  USER_COLLECTION,
  BUSINESS_DETAIL_COLLECTION,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { FieldValue } from "firebase-admin/firestore";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing user ID" });
    }
    try {
      const body = await req.json();

      if (!body.documents) {
        return NextResponse.json(
          { error: "Incomplete application data" },
          { status: 400 },
        );
      }

      const db = firestoreAdmin();
      const userDocRef = db.collection(USER_COLLECTION).doc(userId);
      const docSnapshot = await userDocRef.get();

      if (!docSnapshot.exists)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      const userDoc = docSnapshot;
      const user = userDoc.data();
      const userData = {
        id: userDoc.id,
        ...normalizeAllDates(user),
      };

      // Check document schema - we inject the interestedProduct for validation to work correctly
      documentUploadSchema.parse({
        ...body.documents,
        interestedProduct: userData.fundingDetails?.interestedProduct,
        fundingType: userData.fundingDetails?.fundingType,
      });

      const docs = body.documents;

      // We map the onboarding data to create the ApplyFunding object
      const fundingDataToSave: any = {
        userId: userId,
        interestedProduct: userData.fundingDetails?.interestedProduct || "",
        fundingProducts: userData.fundingDetails?.fundingProducts || [],
        fundingType: userData.fundingDetails?.fundingType || "",
        appliedDate: new Date().toISOString(),
        status: "New",
        analysisStatus: "In Progress",
      };

      if (userData.fundingDetails?.businessName) {
        fundingDataToSave.businessName = userData.fundingDetails.businessName;
      }

      // Map business metrics
      if (userData.businessDetails?.monthlyDeposit) {
        fundingDataToSave.monthlyDeposit =
          userData.businessDetails.monthlyDeposit;
      }
      if (userData.businessDetails?.timeInBusiness) {
        fundingDataToSave.timeInBusiness =
          userData.businessDetails.timeInBusiness;
      }
      if (userData.businessDetails?.creditScore) {
        fundingDataToSave.creditScore = userData.businessDetails.creditScore;
      }

      if (docs) {
        // Universal Fields
        if (docs.ssn) fundingDataToSave.ssn = docs.ssn;
        if (docs.addressStreet)
          fundingDataToSave.addressStreet = docs.addressStreet;
        if (docs.houseNumber) fundingDataToSave.houseNumber = docs.houseNumber;
        if (docs.addressCity) fundingDataToSave.addressCity = docs.addressCity;
        if (docs.addressState)
          fundingDataToSave.addressState = docs.addressState;
        if (docs.addressPostal)
          fundingDataToSave.addressPostal = docs.addressPostal;

        if (docs.employmentType) {
          fundingDataToSave.employmentStatus = docs.employmentType;
        }

        if (docs.businessDocs) {
          fundingDataToSave.employerIdentificationNumber =
            docs.businessDocs.ein;
          // Note: The files are already uploaded by UploadFileV2 to GCS!
        }
      }

      // Create business record first if business data exists
      let businessId: string | undefined;
      if (
        fundingDataToSave.businessName &&
        fundingDataToSave.businessName.trim().length > 0
      ) {
        const businessData = {
          userId: userId,
          businessName: fundingDataToSave.businessName,
          businessStreetAddress: fundingDataToSave.addressStreet || "",
          businessStreetHouseNumber: fundingDataToSave.houseNumber || "",
          businessCityAddress: fundingDataToSave.addressCity || "",
          businessStateAddress: fundingDataToSave.addressState || "",
          businessPostalAddress: fundingDataToSave.addressPostal || "",
          employerIdentificationNumber:
            fundingDataToSave.employerIdentificationNumber || "",
          businessPhoneNumber: userData?.phoneNumber || "000-000-0000",
          businessEmail: userData?.email || "unknown@example.com",
          createdAt: new Date(),
        };

        const businessDocRef = await db
          .collection(BUSINESS_DETAIL_COLLECTION)
          .add(businessData);
        businessId = businessDocRef.id;
        fundingDataToSave.businessId = businessId;
      }

      // Mark the user as onboarded in Firestore and remove temporary data
      const userUpdates: any = {
        isOnboarded: true,
        businessDetails: FieldValue.delete(),
        fundingDetails: FieldValue.delete(),
      };

      if (fundingDataToSave.ssn) {
        userUpdates.ssn = fundingDataToSave.ssn;
      }

      await userDocRef.update(userUpdates);

      // Trigger applyFunding to create app record, and run CRS/Analysis
      const { applyFunding } = await import("@/service/apply-funding");
      await applyFunding({
        value: fundingDataToSave,
        registrationType: "Self",
      });

      return NextResponse.json(
        { success: true, message: "Onboarding submitted successfully" },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Onboarding API Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to process onboarding" },
        { status: 500 },
      );
    }
  },
);

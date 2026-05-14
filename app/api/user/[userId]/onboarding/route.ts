import { NextRequest, NextResponse } from "next/server";
import {
  businessDetailsSchema,
  fundingPageSchema,
  documentUploadSchema,
} from "@/schema/new-registration";
import { authenticateRequest, withAuth } from "@/lib/api-validation";
import { DecodedIdToken } from "firebase-admin/auth";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { badRequest } from "@/app/api/helpers";
import { USER_COLLECTION } from "@/constant/collection-name";

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

      if (!body.business || !body.funding || !body.documents) {
        return NextResponse.json(
          { error: "Incomplete application data" },
          { status: 400 },
        );
      }

      // You can parse schemas again here to double check security.
      businessDetailsSchema.parse(body.business);
      fundingPageSchema.parse(body.funding);

      // Check document schema - we need to inject the interestedProduct for validation to work correctly
      documentUploadSchema.parse({
        ...body.documents,
        interestedProduct: body.funding.interestedProduct,
        fundingType: body.funding.fundingType,
      });

      const db = firestoreAdmin();

      // We need to map the onboarding data to an ApplyFunding object
      const fundingDataToSave: any = {
        userId: userId,
        interestedProduct: body.funding.interestedProduct,
        fundingProducts: body.funding.fundingProducts || [],
        fundingType: body.funding.fundingType,
        appliedDate: new Date().toISOString(),
        status: "New",
        analysisStatus: "In Progress",
      };

      if (body.funding.businessName) {
        fundingDataToSave.businessName = body.funding.businessName;
      }

      // Map business metrics
      if (body.business.monthlyDeposit) {
        fundingDataToSave.monthlyDeposit = body.business.monthlyDeposit;
      }
      if (body.business.timeInBusiness) {
        fundingDataToSave.timeInBusiness = body.business.timeInBusiness;
      }
      if (body.business.creditScore) {
        fundingDataToSave.creditScore = body.business.creditScore;
      }

      // Map address/SSN/EIN from documents step
      const docs = body.documents;
      if (docs) {
        if (docs.businessDocs) {
          fundingDataToSave.employerIdentificationNumber =
            docs.businessDocs.ein;
          fundingDataToSave.ssn = docs.businessDocs.ssn;
          fundingDataToSave.addressStreet = docs.businessDocs.addressStreet;
          fundingDataToSave.houseNumber = docs.businessDocs.houseNumber;
          fundingDataToSave.addressCity = docs.businessDocs.addressCity;
          fundingDataToSave.addressState = docs.businessDocs.addressState;
          fundingDataToSave.addressPostal = docs.businessDocs.addressPostal;
          // Note: The files are already uploaded by UploadFileV2 to GCS!
        } else if (docs.personalW2Docs) {
          fundingDataToSave.ssn = docs.personalW2Docs.ssn;
          fundingDataToSave.addressStreet = docs.personalW2Docs.addressStreet;
          fundingDataToSave.houseNumber = docs.personalW2Docs.houseNumber;
          fundingDataToSave.addressCity = docs.personalW2Docs.addressCity;
          fundingDataToSave.addressState = docs.personalW2Docs.addressState;
          fundingDataToSave.addressPostal = docs.personalW2Docs.addressPostal;
          fundingDataToSave.employmentStatus = "W2 Employed";
        } else if (docs.personalSelfEmployedDocs) {
          fundingDataToSave.ssn = docs.personalSelfEmployedDocs.ssn;
          fundingDataToSave.addressStreet =
            docs.personalSelfEmployedDocs.addressStreet;
          fundingDataToSave.houseNumber =
            docs.personalSelfEmployedDocs.houseNumber;
          fundingDataToSave.addressCity =
            docs.personalSelfEmployedDocs.addressCity;
          fundingDataToSave.addressState =
            docs.personalSelfEmployedDocs.addressState;
          fundingDataToSave.addressPostal =
            docs.personalSelfEmployedDocs.addressPostal;
          fundingDataToSave.employmentStatus = "Self Employed";
        }
      }

      // Create business record first if business data exists
      let businessId: string | undefined;
      if (
        fundingDataToSave.businessName &&
        fundingDataToSave.businessName.trim().length > 0
      ) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        const { recordBusiness } = await import("@/service/business");
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
        };

        businessId = await recordBusiness(businessData);
        fundingDataToSave.businessId = businessId;
      }

      // Trigger applyFunding to create app record, and run CRS/Analysis
      // We pass the mapped data
      const { applyFunding } = await import("@/service/apply-funding");
      const referenceNumber = await applyFunding({
        value: fundingDataToSave,
        registrationType: "Self",
      });

      console.log(
        "Onboarding application submitted with reference number:",
        referenceNumber,
      );

      // Mark the user as onboarded in Firestore
      await db.collection(USER_COLLECTION).doc(userId).set(
        {
          isOnboarded: true,
          businessDetails: body.business, // Keep metrics on the user profile
        },
        { merge: true },
      );

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

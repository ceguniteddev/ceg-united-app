import { NextResponse } from "next/server";
import { authSchema } from "@/schema/new-registration";
import { registerUser } from "@/service/user";
import { User } from "@/schema/registration";
import { firestoreAdmin } from "@/lib/fireabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.auth) {
      return NextResponse.json(
        { error: "Incomplete registration data" },
        { status: 400 },
      );
    }

    // Validate payloads
    const parsedAuth = authSchema.parse(body.auth);

    // Call service to register the user

    let fundingData: any = undefined;

    if (body.business && body.business.fundingType) {
      const typeMap: Record<string, string> = {
        Personal: "Personal",
        Business: "Business",
        Both: "Personal And Business",
      };

      const mappedType = typeMap[body.business.fundingType];

      if (mappedType) {
        fundingData = {
          fundingType: mappedType,
          interestedProduct:
            mappedType === "Personal And Business"
              ? "Personal & Business Funding"
              : `${mappedType} Funding`,
          personalAmountFunding: body.business.fundingAmount,
          businessAmountFunding: body.business.fundingAmount,
          howDoYouGetPaid: body.business.employmentType,
          businessName: body.business.businessName,
          employerIdentificationNumber: body.business.ein,
          industryField: body.business.businessIndustry,
          ficoCreditScore: body.business.creditScore,
          appliedDate: new Date(),
          status: "New",
          analysisStatus: "In Progress",
        };

        if (body.documents) {
          // Map uploaded documents to applyFunding schema arrays
          if (body.documents.driverLicense?.files) {
            fundingData.driverLicenseDocuments =
              body.documents.driverLicense.files.map((f: any) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                storagePath: f.url ? f.url : undefined, // the service downloads it via storagePath
                url: f.url,
              }));
          }

          if (
            body.documents.businessDocs?.bankStatements?.files ||
            body.documents.personalDocs?.bankStatements?.files
          ) {
            const allBankStatements = [
              ...(body.documents.businessDocs?.bankStatements?.files?.map(
                (f: any) => ({ ...f, docType: "BANK_STATEMENTS" }),
              ) || []),
              ...(body.documents.personalDocs?.bankStatements?.files?.map(
                (f: any) => ({ ...f, docType: "PERSONAL_BANK_STATEMENTS" }),
              ) || []),
            ];
            if (allBankStatements.length > 0) {
              fundingData.bankStatements = allBankStatements.map((f: any) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                storagePath: f.url ? f.url : undefined,
                url: f.url,
                docType: f.docType,
              }));
            }
          }

          if (body.documents.personalDocs?.paystubs?.files) {
            fundingData.paystubs =
              body.documents.personalDocs.paystubs.files.map((f: any) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                storagePath: f.url ? f.url : undefined,
                url: f.url,
              }));
          }
        }
      }
    }

    await registerUser({
      user: {
        ...parsedAuth,
        role: "Client",
        isBrokerInvite: false,
        isPremiumClient: false,
        leadId: body.leadId,
      } as any as User,
      registrationType: "Self",
      fundingData: fundingData,
    });

    // Update the lead document status if leadId is provided
    if (body.leadId) {
      const db = firestoreAdmin();
      await db.collection("user-leads").doc(body.leadId).update({
        status: "Registered",
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: true, message: "Registration successful" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("New Registration API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process registration" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authSchema,
  businessDetailsSchema,
  documentUploadSchema,
  RegistrationPurpose,
} from "@/schema/new-registration";
import { registerUser } from "@/service/user";
import { User } from "@/schema/registration";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { uploadDocument } from "@/service/documents";
import {
  ApplyFunding,
  FundingApplicationType,
  FUNDING_PRODUCTS_BY_CATEGORY,
} from "@/schema/apply-funding";
import { ensureIncomeFundingApplication } from "@/service/apply-funding";

const registrationRequestSchema = z
  .object({
    leadId: z.string().nullable().optional(),
    registrationPurpose: z.enum(RegistrationPurpose),
    auth: authSchema,
    business: z.unknown().optional(),
    documents: z.unknown(),
  })
  .superRefine((data, ctx) => {
    const documents = data.documents as any;
    const driverFiles = documents?.driverLicense?.files;

    if (!Array.isArray(driverFiles) || driverFiles.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Driver's license is required",
        path: ["documents", "driverLicense"],
      });
    }

    if (data.registrationPurpose === RegistrationPurpose.Funding) {
      const businessResult = businessDetailsSchema.safeParse(data.business);
      if (!businessResult.success) {
        for (const issue of businessResult.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ["business", ...issue.path],
          });
        }
        return;
      }

      const documentResult = documentUploadSchema.safeParse({
        ...documents,
        registrationPurpose: data.registrationPurpose,
        fundingType: businessResult.data.fundingType,
        employmentType: businessResult.data.employmentType,
      });
      if (!documentResult.success) {
        for (const issue of documentResult.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ["documents", ...issue.path],
          });
        }
      }
    } else {
      const hasFundingDocuments =
        documents?.businessDocs?.bankStatements?.files?.length > 0 ||
        documents?.personalDocs?.bankStatements?.files?.length > 0 ||
        documents?.personalDocs?.paystubs?.files?.length > 0;

      if (data.business !== undefined || hasFundingDocuments) {
        ctx.addIssue({
          code: "custom",
          message:
            "Financial Education registration cannot include funding or financial documents",
          path: ["registrationPurpose"],
        });
      }
    }
  });

async function uploadFinancialEducationDriverLicense({
  userId,
  leadId,
  documents,
}: {
  userId: string;
  leadId?: string | null;
  documents: any;
}) {
  for (const document of documents.driverLicense.files) {
    if (!document.base64 || !document.name || !document.type) {
      throw new Error("Invalid driver's license document payload");
    }

    const base64Data = document.base64.includes(",")
      ? document.base64.split(",")[1]
      : document.base64;
    const buffer = Buffer.from(base64Data, "base64");
    const file = new File([new Uint8Array(buffer)], document.name, {
      type: document.type,
    });

    await uploadDocument({
      userId,
      file,
      documentType: "DRIVERS_LICENSE",
      customMetadata: {
        registrationPurpose: RegistrationPurpose.FinancialEducation,
        uploadedAt: new Date().toISOString(),
        ...(leadId ? { leadId } : {}),
      },
    });
  }
}

function mapFundingData(body: any): ApplyFunding | undefined {
  if (!body.business || !body.business.fundingType) {
    return undefined;
  }

  const typeMap: Record<string, string> = {
    Personal: "Personal",
    Business: "Business",
    Both: "Personal And Business",
  };

  const mappedType = typeMap[
    body.business.fundingType
  ] as FundingApplicationType;

  if (!mappedType) {
    return undefined;
  }

  const interestedProduct =
    mappedType === "Personal And Business"
      ? "Personal & Business Funding"
      : `${mappedType} Funding`;

  const fundingData: ApplyFunding = {
    fundingType: mappedType,
    interestedProduct: interestedProduct,
    fundingProducts: FUNDING_PRODUCTS_BY_CATEGORY[interestedProduct] || [],
    personalAmountFunding:
      mappedType === "Personal" || mappedType === "Personal And Business"
        ? body.business.fundingAmount
        : undefined,
    businessAmountFunding:
      mappedType === "Business" || mappedType === "Personal And Business"
        ? body.business.fundingAmount
        : undefined,
    howDoYouGetPaid: body.business.employmentType,
    businessName: body.business.businessName,
    businessPhoneNumber: body.business.businessPhoneNumber,
    employerIdentificationNumber: body.business.ein,
    industryField: body.business.businessIndustry,
    businessStreetAddress: body.business.businessStreetAddress,
    businessCityAddress: body.business.businessCityAddress,
    businessStateAddress: body.business.businessStateAddress,
    businessPostalAddress: body.business.businessPostalAddress,
    ficoCreditScore:
      mappedType === "Personal" || mappedType === "Personal And Business"
        ? body.business.creditScore
        : undefined,
    businessCreditScore:
      mappedType === "Business" ? body.business.businessCreditScore : undefined,
    statedAnnualIncomeCorrected: body.business.statedAnnualIncomeCorrected,
    additionalMonthlyIncome: body.business.additionalMonthlyIncome,
    additionalIncomeSource: body.business.additionalIncomeSource,
    appliedDate: new Date(),
    status: "New",
    analysisStatus: "Completed",
    consentConfirmTerms: body.auth.consentConfirmTerms,
    consentConfirmPrivacy: body.auth.consentConfirmPrivacy,
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
          base64: f.base64,
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
          base64: f.base64,
          docType: f.docType,
        }));
      }
    }

    if (body.documents.personalDocs?.paystubs?.files) {
      fundingData.paystubs = body.documents.personalDocs.paystubs.files.map(
        (f: any) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          storagePath: f.url ? f.url : undefined,
          url: f.url,
          base64: f.base64,
        }),
      );
    }
  }

  return fundingData;
}

export async function POST(req: Request) {
  try {
    const result = registrationRequestSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: z.prettifyError(result.error) },
        { status: 400 },
      );
    }

    const body = result.data;
    const parsedAuth = body.auth;

    // Call service to register the user
    const fundingData =
      body.registrationPurpose === RegistrationPurpose.Funding
        ? mapFundingData(body)
        : undefined;

    const registeredUser = await registerUser({
      user: {
        ...parsedAuth,
        role: "Client",
        isBrokerInvite: false,
        leadId: body.leadId ?? undefined,
        registrationPurpose: body.registrationPurpose,
      } as any as User,
      registrationType: "Self",
      fundingData: fundingData,
    });

    if (body.registrationPurpose === RegistrationPurpose.FinancialEducation) {
      await uploadFinancialEducationDriverLicense({
        userId: registeredUser.id,
        leadId: body.leadId,
        documents: body.documents,
      });
      await ensureIncomeFundingApplication(registeredUser.id);
    }

    // Update the lead document status if leadId is provided
    if (body.leadId) {
      const db = firestoreAdmin();

      // We also update the lead with the latest auth data since OCR on step 3 might have added address info
      const finalAuthDataForLead = btoa(JSON.stringify(parsedAuth));

      await db.collection("user-leads").doc(body.leadId).update({
        status: "Registered",
        registrationPurpose: body.registrationPurpose,
        data: finalAuthDataForLead,
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

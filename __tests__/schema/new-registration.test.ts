import { describe, expect, it } from "vitest";
import {
  documentUploadSchema,
  FundingType,
  RegistrationPurpose,
} from "@/schema/new-registration";

const documentGroup = (count: number) => ({
  uploaded: count > 0,
  count,
  files: Array.from({ length: count }, (_, index) => ({
    name: `statement-${index + 1}.pdf`,
  })),
});

const businessDocuments = (statementCount: number) => ({
  registrationPurpose: RegistrationPurpose.Funding,
  fundingType: FundingType.Business,
  driverLicense: documentGroup(1),
  businessDocs: {
    bankStatements: documentGroup(statementCount),
  },
});

describe("documentUploadSchema business bank statements", () => {
  it("rejects fewer than four business bank statements", () => {
    const result = documentUploadSchema.safeParse(businessDocuments(1));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Exactly 4 business bank statements are required",
            path: ["businessDocs", "bankStatements"],
          }),
        ]),
      );
    }
  });

  it("accepts exactly four business bank statements", () => {
    expect(documentUploadSchema.safeParse(businessDocuments(4)).success).toBe(
      true,
    );
  });

  it("uses the files array rather than a spoofed count", () => {
    const documents = businessDocuments(1);
    documents.businessDocs.bankStatements.count = 4;

    expect(documentUploadSchema.safeParse(documents).success).toBe(false);
  });
});

describe("documentUploadSchema personal bank statements", () => {
  const personalDocuments = (statementCount: number) => ({
    registrationPurpose: RegistrationPurpose.Funding,
    fundingType: FundingType.Personal,
    employmentType: "Self-employed" as const,
    driverLicense: documentGroup(1),
    personalDocs: {
      bankStatements: documentGroup(statementCount),
    },
  });

  it("rejects fewer than three personal bank statements", () => {
    const result = documentUploadSchema.safeParse(personalDocuments(1));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Exactly 3 personal bank statements are required",
            path: ["personalDocs", "bankStatements"],
          }),
        ]),
      );
    }
  });

  it("accepts exactly three personal bank statements", () => {
    expect(documentUploadSchema.safeParse(personalDocuments(3)).success).toBe(
      true,
    );
  });

  it("uses the files array rather than a spoofed count", () => {
    const documents = personalDocuments(1);
    documents.personalDocs.bankStatements.count = 3;

    expect(documentUploadSchema.safeParse(documents).success).toBe(false);
  });
});

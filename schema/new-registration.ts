import { z } from "zod";
import { passwordSchema, ssnSchema } from "./registration";

export const authSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Last name is required" }),
  ssn: ssnSchema,
  phoneNumber: z
    .string()
    .min(1, "Contact Number is required")
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, "");
        return digits.length >= 10;
      },
      { message: "Enter a valid 10-digit phone number" },
    ),
  email: z.email({ message: "Invalid email address" }),
  password: passwordSchema.optional().or(z.literal("")),
  consentConfirmTerms: z
    .boolean({ message: "You must accept the terms and conditions" })
    .refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  consentConfirmPrivacy: z
    .boolean({ message: "You must accept the privacy policy" })
    .refine((val) => val === true, {
      message: "You must accept the privacy policy",
    }),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPostal: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export type AuthForm = z.infer<typeof authSchema>;

export enum RegistrationPurpose {
  Funding = "Funding",
  FinancialEducation = "Financial Education",
}

export enum FundingType {
  Personal = "Personal",
  Business = "Business",
  Both = "Both",
}

export const businessDetailsSchema = z
  .object({
    fundingAmount: z.coerce.number<number>().optional(),
    fundingType: z.enum(FundingType).or(z.literal("")).nullable().optional(),
    creditScore: z.coerce.number<number>().nullable().optional(),
    businessCreditScore: z.coerce.number<number>().nullable().optional(),
    employmentType: z.enum(["W2", "Self-employed", ""]).nullable().optional(),
    timeInBusiness: z.string().nullable().optional(),
    businessIndustry: z.string().nullable().optional(),
    businessName: z.string().nullable().optional(),
    businessPhoneNumber: z.string().nullable().optional(),
    ein: z.string().nullable().optional(),
    businessStreetAddress: z.string().nullable().optional(),
    businessCityAddress: z.string().nullable().optional(),
    businessStateAddress: z.string().nullable().optional(),
    businessPostalAddress: z.string().nullable().optional(),
    statedAnnualIncomeCorrected: z.coerce
      .number<number>()
      .nullable()
      .optional(),
    additionalMonthlyIncome: z.coerce.number<number>().nullable().optional(),
    additionalIncomeSource: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.fundingAmount || data.fundingAmount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["fundingAmount"],
      });
    }

    if (!data.fundingType) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["fundingType"],
      });
    }

    if (
      data.fundingType === FundingType.Personal ||
      data.fundingType === FundingType.Both
    ) {
      if (
        data.creditScore === undefined ||
        data.creditScore === null ||
        data.creditScore < 400 ||
        data.creditScore > 900
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Credit score must be between 400 and 900",
          path: ["creditScore"],
        });
      }
      if (!data.employmentType) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentType"],
        });
      }
    }

    if (
      data.fundingType === FundingType.Business ||
      data.fundingType === FundingType.Both
    ) {
      if (data.fundingType === FundingType.Business) {
        if (
          data.businessCreditScore === undefined ||
          data.businessCreditScore === null ||
          data.businessCreditScore < 400 ||
          data.businessCreditScore > 900
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Credit score must be between 400 and 900",
            path: ["businessCreditScore"],
          });
        }
      }
      if (!data.timeInBusiness) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["timeInBusiness"],
        });
      }
      if (!data.businessIndustry) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessIndustry"],
        });
      }
      if (!data.businessName) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessName"],
        });
      }
      if (!data.ein || data.ein.length < 10) {
        ctx.addIssue({
          code: "custom",
          message: "Please enter a valid 9-digit EIN",
          path: ["ein"],
        });
      }
    }
  });

export type BusinessDetailsForm = z.infer<typeof businessDetailsSchema>;

export const fundingPageSchema = z
  .object({
    interestedProduct: z
      .string()
      .min(1, { message: "Please select funding category" }),
    fundingType: z.string().min(1, { message: "Please select funding type" }),
    fundingProducts: z.array(z.string()).optional(),
    businessName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.interestedProduct === "Business Funding" ||
        data.interestedProduct === "Personal & Business Funding") &&
      !data.businessName
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Business name is required for business funding",
        path: ["businessName"],
      });
    }
  });

export type FundingPageForm = z.infer<typeof fundingPageSchema>;

export const documentUploadSchema = z
  .object({
    registrationPurpose: z.enum(RegistrationPurpose).optional(),
    fundingType: z.string().nullable().optional(),
    employmentType: z.enum(["W2", "Self-employed", ""]).nullable().optional(),

    driverLicense: z.any().optional(),

    // Business specific
    businessDocs: z
      .object({
        bankStatements: z.any().optional(),
      })
      .optional(),

    // Personal specific
    personalDocs: z
      .object({
        paystubs: z.any().optional(),
        bankStatements: z.any().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const isBusiness =
      data.fundingType === FundingType.Business ||
      data.fundingType === FundingType.Both;
    const isPersonal =
      data.fundingType === FundingType.Personal ||
      data.fundingType === FundingType.Both;

    // Driver's License validation is typically handled at the component level checking `count`
    // However we can enforce it here if we want to ensure the file was uploaded
    if (!data.driverLicense || data.driverLicense?.count === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Driver's license is required",
        path: ["driverLicense"],
      });
    }

    // Funding metadata can remain in the draft when a user switches paths.
    // Financial Education requires identity verification only.
    if (data.registrationPurpose === RegistrationPurpose.FinancialEducation) {
      return;
    }

    if (isPersonal) {
      if (data.employmentType === "W2") {
        if (
          !data.personalDocs?.paystubs ||
          data.personalDocs.paystubs.count === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Paystubs are required",
            path: ["personalDocs", "paystubs"],
          });
        }
      } else if (data.employmentType === "Self-employed") {
        const bankStatements = data.personalDocs?.bankStatements;
        const bankStatementCount = Array.isArray(bankStatements?.files)
          ? bankStatements.files.length
          : (bankStatements?.count ?? 0);

        if (bankStatementCount !== 3) {
          ctx.addIssue({
            code: "custom",
            message: "Exactly 3 personal bank statements are required",
            path: ["personalDocs", "bankStatements"],
          });
        }
      }
    }

    if (isBusiness) {
      const bankStatements = data.businessDocs?.bankStatements;
      const bankStatementCount = Array.isArray(bankStatements?.files)
        ? bankStatements.files.length
        : (bankStatements?.count ?? 0);

      if (bankStatementCount !== 4) {
        ctx.addIssue({
          code: "custom",
          message: "Exactly 4 business bank statements are required",
          path: ["businessDocs", "bankStatements"],
        });
      }
    }
  });

export type DocumentUploadForm = z.infer<typeof documentUploadSchema>;

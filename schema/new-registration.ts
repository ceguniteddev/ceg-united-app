import { z } from "zod";
import { passwordSchema } from "./registration";

export const authSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
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
});

export type AuthForm = z.infer<typeof authSchema>;

export const businessDetailsSchema = z
  .object({
    monthlyDeposit: z.coerce.number<number>().optional(),
    timeInBusiness: z.string().min(1, { message: "Required" }),
    creditScore: z.coerce.number<number>().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.monthlyDeposit === undefined || data.monthlyDeposit <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["monthlyDeposit"],
      });
    }

    if (
      data.creditScore === undefined ||
      data.creditScore < 400 ||
      data.creditScore > 900
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Credit score must be between 400 and 900",
        path: ["creditScore"],
      });
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

const documentUploadBaseSchema = z.object({
  ssn: z.string({ message: "Required" }).min(9, { message: "SSN is required" }),
  addressStreet: z
    .string({ message: "Required" })
    .min(1, { message: "Required" }),
  houseNumber: z.string().optional(),
  addressCity: z
    .string({ message: "Required" })
    .min(1, { message: "Required" }),
  addressState: z
    .string({ message: "Required" })
    .min(1, { message: "Required" }),
  addressPostal: z
    .string({ message: "Required" })
    .min(1, { message: "Required" }),
});

export const documentUploadBusinessSchema = documentUploadBaseSchema.extend({
  driverLicense: z.any().optional(), // In reality, an array of files or base64 strings
  bankStatements: z.any().optional(),
  ein: z.string().min(1, { message: "EIN is required" }),
  // authorizationWaiver: z.boolean().refine((val) => val === true, {
  //   message: "You must accept the authorization waiver",
  // }),
});

export const documentUploadPersonalW2Schema = documentUploadBaseSchema.extend({
  driverLicense: z.any().optional(),
  paystubs: z.any().optional(),
});

export const documentUploadPersonalSelfEmployedSchema =
  documentUploadBaseSchema.extend({
    driverLicense: z.any().optional(),
    bankStatements: z.any().optional(),
  });

export const documentUploadSchema = z
  .object({
    interestedProduct: z.string().optional(),
    fundingType: z.string().optional(),
    employmentType: z.enum(["W2 Employed", "Self Employed"]).optional(),
    businessDocs: z.any().optional(),
    personalW2Docs: z.any().optional(),
    personalSelfEmployedDocs: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.interestedProduct === "Business Funding" ||
      data.interestedProduct === "Personal & Business Funding"
    ) {
      const result = documentUploadBusinessSchema.safeParse(data.businessDocs);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ["businessDocs", ...issue.path] });
        });
      }
    }

    if (
      data.interestedProduct === "Personal Funding" ||
      data.interestedProduct === "Personal & Business Funding"
    ) {
      if (!data.employmentType) {
        ctx.addIssue({
          code: "custom",
          message: "Employment type is required for personal funding",
          path: ["employmentType"],
        });
      } else if (data.employmentType === "W2 Employed") {
        const result = documentUploadPersonalW2Schema.safeParse(
          data.personalW2Docs,
        );
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({ ...issue, path: ["personalW2Docs", ...issue.path] });
          });
        }
      } else if (data.employmentType === "Self Employed") {
        const result = documentUploadPersonalSelfEmployedSchema.safeParse(
          data.personalSelfEmployedDocs,
        );
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ["personalSelfEmployedDocs", ...issue.path],
            });
          });
        }
      }
    }
  });

export type DocumentUploadForm = z.infer<typeof documentUploadSchema>;

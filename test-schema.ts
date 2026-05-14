import { z } from "zod";

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
    businessDocs: documentUploadBusinessSchema.optional(),
    personalW2Docs: documentUploadPersonalW2Schema.optional(),
    personalSelfEmployedDocs:
      documentUploadPersonalSelfEmployedSchema.optional(),
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

const data = {
  fundingType: "Business",
  interestedProduct: "Business Funding",
  businessDocs: {
    ein: "123",
    ssn: "123-12-3123",
    addressStreet: "18117 BISCAYNE BLVD APT 1584",
    addressCity: "AVENTURA",
    addressState: "FL",
    addressPostal: "33160",
    driverLicense: {
      uploaded: true,
      files: ["uploaded-file"],
    },
    bankStatements: {
      uploaded: true,
      files: ["uploaded-file"],
    },
  },
  employmentType: "W2 Employed",
  personalW2Docs: {
    driverLicense: {
      uploaded: true,
      files: ["uploaded-file"],
    },
    paystubs: {
      uploaded: false,
      files: [],
    },
  },
};

console.log(JSON.stringify(documentUploadSchema.safeParse(data), null, 2));

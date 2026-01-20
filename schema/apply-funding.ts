import z from "zod";
import { registrationSchema } from "./registration";

export const FundingApplicationSatus = [
  "New",
  "Processing",
  "Pre-Approved",
  "Approved",
  "Declined",
] as const;
export const FundingApplicationSatusEnum = z.enum(FundingApplicationSatus);
export type FundingApplicationSatus = z.infer<
  typeof FundingApplicationSatusEnum
>;

export const FundingApplicationType = [
  "Personal",
  "Business",
  "Personal And Business",
  "Equipment Financing",
  "Income",
  "Community",
  "Tradelines",
  "All",
] as const;
export const FundingApplicationTypeEnum = z.enum(FundingApplicationType, {
  error: "Required",
});
export type FundingApplicationType = z.infer<typeof FundingApplicationTypeEnum>;

export const getFundingApplicationType = () => {
  const data = FundingApplicationTypeEnum.options;

  return data.map((type) => ({
    value: type,
    label: type,
  }));
};

export const fundingApplicationApproveDeclineSchema = z.object({
  id: z.string().optional(),
  amountApprove: z
    .number({ error: "Numeric value is required" })
    .min(1, { error: "Required" }),
  remarks: z.string().optional(),
});

export type FundingApplicationApproveDecline = z.infer<
  typeof fundingApplicationApproveDeclineSchema
>;

export const employmentSchema = z.object({
  howDoYouGetPaid: z.string().min(1, { message: "Required" }),
  employmentPayPerMonth: z.coerce
    .number<number>({ error: "Required" })
    .min(1, { message: "Required" }),
  employmentEmployerName: z.string().optional(),
  employmentOccupation: z.string().min(1, { message: "Required" }),
});

export type Employment = z.infer<typeof employmentSchema>;

export const applyFundingSchema = z
  .object({
    userId: z.string().optional(),
    status: FundingApplicationSatusEnum,
    appliedDate: z.coerce.date<Date>({ error: "Required" }),
    referenceNumber: z.string().optional(),

    interestedProduct: z.string().min(1, { error: "Required" }),
    fundingType: FundingApplicationTypeEnum,

    personalAmountFunding: z.coerce.number<number>().optional(),
    businessAmountFunding: z.coerce.number<number>().optional(),

    isMarried: z.string().optional(),
    legalResident: z.string().optional(),
    currentSituation: z.string().optional(),

    driverLicenseNumber: z.string().optional(),
    driverLicenseState: z.string().optional(),
    driverLicenseIssueDate: z.coerce
      .date<Date>({ error: "Require Date" })
      .optional(),
    driverLicenseIssueExpiryDate: z.coerce
      .date<Date>({ error: "Require Date" })
      .optional(),

    // legalResidentOther: z.string().optional(),
    // motherMaidenName: z.string().min(1, { error: "Required" }),
    addressStreet: z.string().min(1, { error: "Required" }),
    houseNumber: z.string().optional(),
    addressCity: z.string().min(1, { error: "Required" }),
    addressState: z.string().min(1, { error: "Required" }),
    addressPostal: z.string().min(1, { error: "Required" }),

    moveInCurrentAddress: z.coerce
      .date<Date>({ error: "Require Date" })
      .optional(),
    payPerMonth: z.coerce.number<number>().optional(),
    rentOrMortgage: z.string().optional(),

    howDoYouGetPaid: z.string().optional(),
    // howDoYouGetPaid: z.string().min(1, { error: "Required" }),
    employmentStatus: z.string().optional(),
    employmentPayPerMonth: z.coerce.number<number>().optional(),
    employmentEmployerName: z.string().optional(),
    employmentEmployerPhoneNumber: z.string().optional(),
    // employmentEmployerAddress: z.string().optional(),
    employmentEmployerAddressStreet: z.string().optional(),
    employmentEmployerHouseNumber: z.string().optional(),
    employmentEmployerAddressCity: z.string().optional(),
    employmentEmployerAddressState: z.string().optional(),
    employmentEmployerAddressPostal: z.string().optional(),

    employmentOccupation: z.string().optional(),
    employmentDateOfHire: z.coerce
      .date<Date>({ error: "Require Date" })
      .optional(),

    employments: z.array(employmentSchema).optional(),

    personalTaxes: z.string().optional(),
    personalTaxesStatus: z.string().optional(),
    personalTaxes1: z.coerce.number<number>().optional(),
    personalTaxes2: z.coerce.number<number>().optional(),
    personalTaxes3: z.coerce.number<number>().optional(),

    businessId: z.string().optional(),
    businessName: z.string().optional(),
    businessStreetAddress: z.string().optional(),
    businessStreetHouseNumber: z.string().optional(),
    businessCityAddress: z.string().optional(),
    businessStateAddress: z.string().optional(),
    businessPostalAddress: z
      .string()
      // .trim()
      // .regex(/^\d{5}$/, { message: "Must be exactly 5 digits" })
      .optional(),
    employerIdentificationNumber: z.string().optional(),
    businessPhoneNumber: z.string().optional(),
    businessEmail: z
      // .string()
      .email({ message: "Invalid email" })
      .or(z.literal(""))
      .optional(),
    businessWebsite: z.string().optional(),
    socialMedia: z
      .array(
        z
          .object({
            platform: z.string().optional(),
            handle: z.string().optional(),
          })
          .optional(),
      )
      .optional(),
    // lastYearTaxes: z.coerce.number<number>().optional(),
    // currentYearTaxes: z.coerce.number<number>().optional(),

    stateOfIncorporation: z.string().optional(),
    dateOfIncorporation: z.coerce
      .date<Date>({ error: "Require Date" })
      .optional(),

    businessGrossProjectedRevenue1: z.coerce.number<number>().optional(),
    businessGrossProjectedRevenue2: z.coerce.number<number>().optional(),
    businessGrossProjectedRevenue3: z.coerce.number<number>().optional(),

    businessFiledWithIRS1: z.coerce.boolean<boolean>().optional(),
    businessFiledWithIRS2: z.coerce.boolean<boolean>().optional(),
    businessFiledWithIRS3: z.coerce.boolean<boolean>().optional(),

    businessProjectedProfit1: z.coerce.number<number>().optional(),
    businessProjectedProfit2: z.coerce.number<number>().optional(),
    businessProjectedProfit3: z.coerce.number<number>().optional(),

    industryField: z.string().optional(),

    // Bridge Loan Application Fields (Business Income Based Funding)
    useOfFunds: z.string().optional(),
    annualBusinessRevenue: z.coerce.number<number>().optional(),
    avgMonthlyCreditCardSales: z.coerce.number<number>().optional(),
    avgDailyBankBalance: z.coerce.number<number>().optional(),
    businessPropertyType: z.enum(["Lease", "Own"]).or(z.literal("")).optional(),
    landlordName: z.string().optional(),
    landlordPhone: z.string().optional(),
    monthlyPayment: z.coerce.number<number>().optional(),
    isSeasonalBusiness: z.enum(["Yes", "No"]).or(z.literal("")).optional(),
    hasOutstandingAdvances: z.enum(["Yes", "No"]).or(z.literal("")).optional(),
    // personalFullName: z.string().optional(),
    // personalPhoneNumber: z.string().optional(),
    // personalEmailAddress: z.string().optional(),
    // dateOfBirth: z.coerce.date<Date>({ error: "Require Date" }).optional(),
    // socialSecurityNumber: z.string().optional(),
    // ficoCreditScore: z.coerce.number<number>().optional(),
    whoReferredYou: z.string().optional(),

    // Auto Loan Fields
    vehiclePrice: z.coerce.number<number>().optional(),
    vehiclePurchaseSource: z
      .enum([
        "Independent Dealer",
        "Franchise Dealer",
        "Private Party",
        "Refinancing Current Auto",
      ])
      .or(z.literal(""))
      .optional(),
    vehicleVIN: z.string().optional(),
    vehicleFinancingType: z
      .enum(["Personal", "Business"])
      .or(z.literal(""))
      .optional(),

    // businessTaxes: z.string().optional(),
    // businessTaxesStatus: z.string().optional(),
    // businessTaxes1: z.coerce.number<number>().optional(),
    // businessTaxes2: z.coerce.number<number>().optional(),
    // businessTaxes3: z.coerce.number<number>().optional(),

    approveOrDecline: fundingApplicationApproveDeclineSchema.optional(),

    reasonForJoiningCommunity: z.string().optional(),

    experianUsername: z.string().optional(),
    experianPassword: z.string().optional(),
    creditKarmaUsername: z.string().optional(),
    creditKarmaPassword: z.string().optional(),

    // Document uploads (stored as base64 strings for persistence)
    bankStatements: z
      .array(
        z.object({
          name: z.string(),
          size: z.number(),
          type: z.string(),
          base64: z.string(),
        }),
      )
      .optional(),
    driverLicenseDocuments: z
      .array(
        z.object({
          name: z.string(),
          size: z.number(),
          type: z.string(),
          base64: z.string(),
        }),
      )
      .optional(),
    consentConfirm: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Define the exclusion condition for clarity
    const isExcludedProduct =
      !data.interestedProduct || // Handle case where it's not selected yet
      data.interestedProduct.includes("Tradelines") ||
      data.interestedProduct.includes("Shelf");

    // If the product is an excluded type, we don't need to validate these fields.
    // So we simply exit the function.
    if (isExcludedProduct) {
      return;
    }

    // If the product is NOT excluded, then all driver's license fields become required.
    // We now check each one and add an issue if it's empty.

    // if (
    //   !data.driverLicenseNumber ||
    //   data.driverLicenseNumber.trim().length === 0
    // ) {
    //   ctx.addIssue({
    //     code: "custom",
    //     message: "Driver license number is required.",
    //     path: ["driverLicenseNumber"], // Links error to the correct field
    //   });
    // }

    // if (
    //   !data.driverLicenseState ||
    //   data.driverLicenseState.trim().length === 0
    // ) {
    //   ctx.addIssue({
    //     code: "custom",
    //     message: "Driver license state is required.",
    //     path: ["driverLicenseState"],
    //   });
    // }

    // For dates, we just need to check if they exist
    // if (!data.driverLicenseIssueDate) {
    //   ctx.addIssue({
    //     code: "custom",
    //     message: "Issue date is required.",
    //     path: ["driverLicenseIssueDate"],
    //   });
    // }

    // if (!data.driverLicenseIssueExpiryDate) {
    //   ctx.addIssue({
    //     code: "custom",
    //     message: "Expiry date is required.",
    //     path: ["driverLicenseIssueExpiryDate"],
    //   });
    // }
  })
  // .refine(
  //   (data) => {
  //     // First, check if an interestedProduct has been selected.
  //     if (!data.interestedProduct) {
  //       // If not, we can't perform the check, so we pass validation.
  //       // The base 'min(1)' rule on interestedProduct will catch this separately.
  //       return true;
  //     }

  //     // Define the exclusion condition.
  //     const isExcluded =
  //       data.interestedProduct.includes("Tradelines") ||
  //       data.interestedProduct.includes("Shelf");

  //     // If the product is one of the excluded types, this validation rule passes.
  //     if (isExcluded) {
  //       return true;
  //     }

  //     // If the product is NOT excluded, then 'isMarried' becomes required.
  //     // We check if it's a non-empty string.
  //     return data.isMarried && data.isMarried.trim().length > 0;
  //   },
  //   {
  //     // The message that will be displayed if the validation fails.
  //     message: "This field is required.",
  //     // This is crucial: it links the error message directly to the 'isMarried' field in your form.
  //     path: ["isMarried"],
  //   }
  // )
  // .superRefine((data, ctx) => {
  //   // The condition: Only run this validation if a business name has been entered.
  //   if (
  //     data.businessName &&
  //     data.businessName.trim().length > 0 &&
  //     data.interestedProduct !== "Business Income Based Funding"
  //   ) {
  //     // Validate the three Gross Projected Revenue fields
  //     const r1 = data.businessGrossProjectedRevenue1 ?? 0;
  //     const r2 = data.businessGrossProjectedRevenue2 ?? 0;
  //     const r3 = data.businessGrossProjectedRevenue3 ?? 0;

  //     if (r1 <= 0 && r2 <= 0 && r3 <= 0) {
  //       ctx.addIssue({
  //         code: "custom",
  //         message: "At least one revenue year is required",
  //         path: ["businessGrossProjectedRevenue1"],
  //       });
  //       ctx.addIssue({
  //         code: "custom",
  //         message: "At least one revenue year is required",
  //         path: ["businessGrossProjectedRevenue2"],
  //       });
  //       ctx.addIssue({
  //         code: "custom",
  //         message: "At least one revenue year is required",
  //         path: ["businessGrossProjectedRevenue3"],
  //       });
  //     }
  //   }
  // })
  // .superRefine((data, ctx) => {
  // Check if the business taxes status is 'yes'.
  // This value would be set by your handleBusinessTaxesChange callback.
  // if (data.businessTaxesStatus === "yes") {
  //   const t1 = data.businessTaxes1 ?? 0;
  //   const t2 = data.businessTaxes2 ?? 0;
  //   const t3 = data.businessTaxes3 ?? 0;
  //   if (t1 <= 0 && t2 <= 0 && t3 <= 0) {
  //     ctx.addIssue({
  //       code: "custom",
  //       message: "At least one tax year is required",
  //       path: ["businessTaxes1"],
  //     });
  //     ctx.addIssue({
  //       code: "custom",
  //       message: "At least one tax year is required",
  //       path: ["businessTaxes2"],
  //     });
  //     ctx.addIssue({
  //       code: "custom",
  //       message: "At least one tax year is required",
  //       path: ["businessTaxes3"],
  //     });
  //   }
  // }
  // })
  .superRefine((data, ctx) => {
    // Check if the user has filed taxes before
    if (data.personalTaxesStatus === "yes") {
      const t1 = data.personalTaxes1 ?? 0;
      const t2 = data.personalTaxes2 ?? 0;
      const t3 = data.personalTaxes3 ?? 0;

      // Only validate if ALL three fields are empty/zero
      if (t1 <= 0 && t2 <= 0 && t3 <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one tax year is required",
          path: ["personalTaxes1"],
        });
        ctx.addIssue({
          code: "custom",
          message: "At least one tax year is required",
          path: ["personalTaxes2"],
        });
        ctx.addIssue({
          code: "custom",
          message: "At least one tax year is required",
          path: ["personalTaxes3"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    console.log("Employment superRefine called with data:", data);
    // Check if the employment status is 'yes'
    // Exclude Auto Loan with Business financing and Community funding from employment validation
    if (
      data.employmentStatus === "yes" &&
      !(
        (data.interestedProduct === "Auto Loan" &&
          data.vehicleFinancingType === "Business") ||
        data.fundingType === "Community" ||
        data.interestedProduct === "Business Income Based Funding"
      )
    ) {
      // If it is, validate each employment field
      if (
        !data.employmentEmployerName ||
        data.employmentEmployerName.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerName"],
        });
      }
      if ((data.employmentPayPerMonth ?? 0) <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentPayPerMonth"],
        });
      }
      if (
        !data.employmentEmployerPhoneNumber ||
        data.employmentEmployerPhoneNumber.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerPhoneNumber"],
        });
      }
      // if (
      //   !data.employmentEmployerAddress ||
      //   data.employmentEmployerAddress.length === 0
      // ) {
      //   ctx.addIssue({
      //     code: "custom",
      //     message: "Required",
      //     path: ["employmentEmployerAddress"],
      //   });
      // }

      if (
        !data.employmentEmployerAddressStreet ||
        data.employmentEmployerAddressStreet.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerAddressStreet"],
        });
      }

      // if (
      //   !data.employmentEmployerHouseNumber ||
      //   data.employmentEmployerHouseNumber.length === 0
      // ) {
      //   ctx.addIssue({
      //     code: "custom",
      //     message: "Required",
      //     path: ["employmentEmployerHouseNumber"],
      //   });
      // }

      if (
        !data.employmentEmployerAddressCity ||
        data.employmentEmployerAddressCity.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerAddressCity"],
        });
      }

      if (
        !data.employmentEmployerAddressState ||
        data.employmentEmployerAddressState.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerAddressState"],
        });
      }

      if (
        !data.employmentEmployerAddressPostal ||
        data.employmentEmployerAddressPostal.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerAddressPostal"],
        });
      }

      if (
        !data.employmentOccupation ||
        data.employmentOccupation.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentOccupation"],
        });
      }
      if (!data.employmentDateOfHire) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentDateOfHire"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    // Validate minimal employment fields for Community funding
    if (data.fundingType === "Community" && data.employmentStatus === "yes") {
      if ((data.employmentPayPerMonth ?? 0) <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentPayPerMonth"],
        });
      }
      if (
        !data.employmentOccupation ||
        data.employmentOccupation.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentOccupation"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    // Validate all required business fields when Business funding type is selected
    if (data.fundingType?.includes("Business")) {
      if (!data.businessName || data.businessName.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessName"],
        });
      }

      if (
        !data.employerIdentificationNumber ||
        data.employerIdentificationNumber.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employerIdentificationNumber"],
        });
      }

      if (!data.businessEmail || data.businessEmail.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessEmail"],
        });
      }

      if (
        !data.businessPhoneNumber ||
        data.businessPhoneNumber.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessPhoneNumber"],
        });
      }

      if (
        !data.businessStreetAddress ||
        data.businessStreetAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessStreetAddress"],
        });
      }

      if (
        !data.businessCityAddress ||
        data.businessCityAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessCityAddress"],
        });
      }

      if (
        !data.businessStateAddress ||
        data.businessStateAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessStateAddress"],
        });
      }

      if (
        !data.businessPostalAddress ||
        data.businessPostalAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessPostalAddress"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    // If funded by Community, require a non-empty reason and funding amount
    if (data.fundingType?.includes("Community")) {
      if (
        !data.reasonForJoiningCommunity ||
        data.reasonForJoiningCommunity.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["reasonForJoiningCommunity"],
        });
      }

      // Require funding amount for Community products
      if (
        data.personalAmountFunding == null ||
        data.personalAmountFunding <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["personalAmountFunding"],
        });
      }
    }

    // If funded by Equipment Financing (excluding Auto Loan), require personal amount and business info
    if (
      data.fundingType?.includes("Equipment Financing") &&
      data.interestedProduct !== "Auto Loan"
    ) {
      if (
        data.personalAmountFunding == null ||
        data.personalAmountFunding <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["personalAmountFunding"],
        });
      }

      // Business information requirements
      if (!data.businessName || data.businessName.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessName"],
        });
      }

      if (
        !data.employerIdentificationNumber ||
        data.employerIdentificationNumber.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employerIdentificationNumber"],
        });
      }

      if (!data.businessEmail || data.businessEmail.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessEmail"],
        });
      }

      if (
        !data.businessPhoneNumber ||
        data.businessPhoneNumber.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessPhoneNumber"],
        });
      }

      if (
        !data.businessStreetAddress ||
        data.businessStreetAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessStreetAddress"],
        });
      }

      if (
        !data.businessCityAddress ||
        data.businessCityAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessCityAddress"],
        });
      }

      if (
        !data.businessStateAddress ||
        data.businessStateAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessStateAddress"],
        });
      }

      if (
        !data.businessPostalAddress ||
        data.businessPostalAddress.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessPostalAddress"],
        });
      }
    }

    // Auto Loan validation
    if (data.interestedProduct === "Auto Loan") {
      // Funding amount is required
      if (
        data.personalAmountFunding == null ||
        data.personalAmountFunding <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["personalAmountFunding"],
        });
      }

      // Vehicle price is required
      if (data.vehiclePrice == null || data.vehiclePrice <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["vehiclePrice"],
        });
      }

      // Purchase source is required
      if (
        !data.vehiclePurchaseSource ||
        data.vehiclePurchaseSource.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["vehiclePurchaseSource"],
        });
      }

      // Financing type is required
      if (
        !data.vehicleFinancingType ||
        data.vehicleFinancingType.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["vehicleFinancingType"],
        });
      }

      // If business financing, require all business fields
      if (data.vehicleFinancingType === "Business") {
        if (!data.businessName || data.businessName.trim().length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessName"],
          });
        }

        if (
          !data.employerIdentificationNumber ||
          data.employerIdentificationNumber.trim().length === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["employerIdentificationNumber"],
          });
        }

        if (!data.businessEmail || data.businessEmail.trim().length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessEmail"],
          });
        }

        if (
          !data.businessPhoneNumber ||
          data.businessPhoneNumber.trim().length === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessPhoneNumber"],
          });
        }

        if (
          !data.businessStreetAddress ||
          data.businessStreetAddress.trim().length === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessStreetAddress"],
          });
        }

        if (
          !data.businessCityAddress ||
          data.businessCityAddress.trim().length === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessCityAddress"],
          });
        }

        if (
          !data.businessStateAddress ||
          data.businessStateAddress.trim().length === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessStateAddress"],
          });
        }

        if (
          !data.businessPostalAddress ||
          data.businessPostalAddress.trim().length === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["businessPostalAddress"],
          });
        }
      }

      // If personal financing, require employment information
      if (data.vehicleFinancingType === "Personal") {
        if (!data.howDoYouGetPaid || data.howDoYouGetPaid.trim().length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Requiredss",
            path: ["howDoYouGetPaid"],
          });
        }
      }
    }

    // Business Income Based Funding validation
    if (data.interestedProduct === "Business Income Based Funding") {
      // Use of Funds is required
      if (!data.useOfFunds || data.useOfFunds.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["useOfFunds"],
        });
      }

      // Financial Information - Annual Business Revenue is required
      if (
        data.annualBusinessRevenue == null ||
        data.annualBusinessRevenue <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["annualBusinessRevenue"],
        });
      }

      // Average Monthly Credit Card Sales is required
      if (
        data.avgMonthlyCreditCardSales == null ||
        data.avgMonthlyCreditCardSales <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["avgMonthlyCreditCardSales"],
        });
      }

      // Average Daily Bank Balance is required
      if (data.avgDailyBankBalance == null || data.avgDailyBankBalance <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["avgDailyBankBalance"],
        });
      }

      // Business Property Type is required
      if (
        !data.businessPropertyType ||
        data.businessPropertyType.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessPropertyType"],
        });
      }

      // Landlord Name is required
      if (!data.landlordName || data.landlordName.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["landlordName"],
        });
      }

      // Landlord Phone is required
      if (!data.landlordPhone || data.landlordPhone.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["landlordPhone"],
        });
      }

      // Monthly Payment is required
      if (data.monthlyPayment == null || data.monthlyPayment <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["monthlyPayment"],
        });
      }

      // Is Seasonal Business is required
      if (
        !data.isSeasonalBusiness ||
        data.isSeasonalBusiness.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["isSeasonalBusiness"],
        });
      }

      // Has Outstanding Advances is required
      if (
        !data.hasOutstandingAdvances ||
        data.hasOutstandingAdvances.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["hasOutstandingAdvances"],
        });
      }
    }

    // If funded by Personal, require a positive amount
    if (data.fundingType?.includes("Personal")) {
      if (
        data.personalAmountFunding == null ||
        data.personalAmountFunding <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["personalAmountFunding"],
        });
      }
      // console.log(
      //   "Validating howDoYouGetPaid for Personal funding",
      //   data.howDoYouGetPaid
      // );
      if (
        data.howDoYouGetPaid == undefined ||
        data.howDoYouGetPaid == null ||
        data.howDoYouGetPaid.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["howDoYouGetPaid"],
        });
      }
    }
  })

  .refine(
    (data) => {
      if (
        data.fundingType?.includes("Personal")
        // !data.interestedProduct?.includes("Tradelines") &&
        // !data.interestedProduct?.includes("Shelf")
      ) {
        return (
          data.personalAmountFunding !== undefined &&
          data.personalAmountFunding > 0
        );
      }
      return true;
    },
    {
      message: "Required",
      path: ["personalAmountFunding"],
    },
  )
  .refine(
    (data) => {
      if (data.fundingType?.includes("Business")) {
        return (
          data.businessAmountFunding !== undefined &&
          data.businessAmountFunding > 0
        );
      }
      return true;
    },
    {
      message: "Required",
      path: ["businessAmountFunding"],
    },
  )
  .superRefine((data, ctx) => {
    // Helper that checks membership whether fundingType is string or string[]
    const has = (needle: string) => {
      const ft = data.fundingType;
      if (!ft) return false;
      return ft.includes(needle);
    };

    const triggered =
      has("Business") || has("Personal") || has("Equipment Financing");
    if (!triggered) return;

    // --- Put your conditional validations here ---
    // Examples (edit/remove as needed):

    if (!data.moveInCurrentAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["moveInCurrentAddress"],
      });
    }

    if (
      data.payPerMonth == null ||
      !Number.isFinite(data.payPerMonth) ||
      data.payPerMonth <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["payPerMonth"],
      });
    }

    if (!data.rentOrMortgage) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["rentOrMortgage"],
      });
    }

    if (!data.legalResident) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["legalResident"],
      });
    }
  });

export type ApplyFunding = z.infer<typeof applyFundingSchema>;

export type ApplyFundingWithUser = ApplyFunding & {
  user?: z.infer<typeof registrationSchema> | null;
};

export type FundingProductEnumType = {
  value: string;
  label: string;
  type: FundingApplicationType;
};

export const FundingProductTypeEnum: FundingProductEnumType[] = [
  {
    value: "Personal & Business Funding",
    label: "Personal & Business Funding",
    type: "Personal And Business",
  },
  {
    value: "Business Income Based Funding",
    label: "Business Income Based Funding",
    type: "Business",
  },
  {
    value: "Personal Funding",
    label: "Personal Funding",
    type: "Personal",
  },
  {
    value: "Business Funding",
    label: "Business Funding",
    type: "Business",
  },
  // {
  //   value: "Personal Tradelines",
  //   label: "Personal Tradelines",
  //   type: "Tradelines",
  // },
  // {
  //   value: "Business Tradelines",
  //   label: "Business Tradelines",
  //   type: "Tradelines",
  // },
  // {
  //   value: "Personal & Business Tradelines",
  //   label: "Personal & Business Tradelines",
  //   type: "Tradelines",
  // },
  // {
  //   value: "Aged Shelf Corporation",
  //   label: "Aged Shelf Corporation",
  //   type: "Business",
  // },
  {
    value: "Credit Analysis",
    label: "Credit Analysis",
    type: "Community",
  },
  {
    value: "Auto Loan",
    label: "Auto Loan",
    type: "Equipment Financing",
  },
  {
    value: "Equipment Financing",
    label: "Equipment Financing",
    type: "Equipment Financing",
  },
];

export type FundingProductType = (typeof FundingProductTypeEnum)[number];

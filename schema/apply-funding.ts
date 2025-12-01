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

export const applyFundingSchema = z
  .object({
    userId: z.string().min(1, { error: "Required" }),
    status: FundingApplicationSatusEnum,
    appliedDate: z.coerce.date<Date>({ error: "Required" }),
    referenceNumber: z.string().optional(),

    interestedProduct: z.string().min(1, { error: "Required" }),
    fundingType: FundingApplicationTypeEnum,

    personalAmountFunding: z.coerce.number<number>().optional(),
    businessAmountFunding: z.coerce.number<number>().optional(),

    isMarried: z.string().optional(),
    legalResident: z.string().optional(), //TODO
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
    businessPostalAddress: z.string().optional(),
    employerIdentificationNumber: z.string().optional(),
    businessPhoneNumber: z.string().optional(),
    businessEmail: z.email({ message: "Invalid email" }).optional(),
    businessWebsite: z.string({ error: "Required" }).optional(),
    socialMedia: z.string({ error: "Required" }).optional(),
    // lastYearTaxes: z.coerce.number<number>().optional(),
    // currentYearTaxes: z.coerce.number<number>().optional(),

    stateOfIncorporation: z.string().optional(),
    dateOfIncorporation: z.coerce
      .date<Date>({ error: "Require Date" })
      .optional(),

    businessGrossProjectedRevenue1: z.coerce.number<number>().optional(),
    businessGrossProjectedRevenue2: z.coerce.number<number>().optional(),
    businessGrossProjectedRevenue3: z.coerce.number<number>().optional(),

    businessProjectedProfit1: z.coerce.number<number>().optional(),
    businessProjectedProfit2: z.coerce.number<number>().optional(),
    businessProjectedProfit3: z.coerce.number<number>().optional(),

    industryField: z.string().optional(),

    businessTaxes: z.string().optional(),
    businessTaxesStatus: z.string().optional(),
    businessTaxes1: z.coerce.number<number>().optional(),
    businessTaxes2: z.coerce.number<number>().optional(),
    businessTaxes3: z.coerce.number<number>().optional(),

    approveOrDecline: fundingApplicationApproveDeclineSchema.optional(),

    reasonForJoiningCommunity: z.string().optional(),

    experianUsername: z.string().optional(),
    experianPassword: z.string().optional(),
    creditKarmaUsername: z.string().optional(),
    creditKarmaPassword: z.string().optional(),
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
  .superRefine((data, ctx) => {
    // The condition: Only run this validation if a business name has been entered.
    if (data.businessName && data.businessName.trim().length > 0) {
      // Validate the three Gross Projected Revenue fields
      const r1 = data.businessGrossProjectedRevenue1 ?? 0;
      const r2 = data.businessGrossProjectedRevenue2 ?? 0;
      const r3 = data.businessGrossProjectedRevenue3 ?? 0;

      if (r1 <= 0 && r2 <= 0 && r3 <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one revenue year is required",
          path: ["businessGrossProjectedRevenue1"],
        });
        ctx.addIssue({
          code: "custom",
          message: "At least one revenue year is required",
          path: ["businessGrossProjectedRevenue2"],
        });
        ctx.addIssue({
          code: "custom",
          message: "At least one revenue year is required",
          path: ["businessGrossProjectedRevenue3"],
        });
      }

      // Validate the three Projected Profit fields
      const p1 = data.businessProjectedProfit1 ?? 0;
      const p2 = data.businessProjectedProfit2 ?? 0;
      const p3 = data.businessProjectedProfit3 ?? 0;

      if (p1 <= 0 && p2 <= 0 && p3 <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one profit year is required",
          path: ["businessProjectedProfit1"],
        });
        ctx.addIssue({
          code: "custom",
          message: "At least one profit year is required",
          path: ["businessProjectedProfit2"],
        });
        ctx.addIssue({
          code: "custom",
          message: "At least one profit year is required",
          path: ["businessProjectedProfit3"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    // Check if the business taxes status is 'yes'.
    // This value would be set by your handleBusinessTaxesChange callback.
    if (data.businessTaxesStatus === "yes") {
      // If the status is 'yes', then all three tax year fields are required.
      // We check if the coerced number is 0 or less, which covers empty inputs.
      if ((data.businessTaxes1 ?? 0) <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessTaxes1"], // Links the error to the correct input field.
        });
      }

      if ((data.businessTaxes2 ?? 0) <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessTaxes2"],
        });
      }

      if ((data.businessTaxes3 ?? 0) <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["businessTaxes3"],
        });
      }
    }
  })
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
    // Check if the employment status is 'yes'
    if (data.employmentStatus === "yes") {
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

      if (
        !data.employmentEmployerHouseNumber ||
        data.employmentEmployerHouseNumber.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["employmentEmployerHouseNumber"],
        });
      }

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
  .refine(
    (data) => {
      if (data.fundingType?.includes("Business")) {
        return data.businessName && data.businessName.length > 0;
      }
      return true;
    },
    {
      message: "Required",
      path: ["businessName"],
    }
  )
  .superRefine((data, ctx) => {
    // If funded by Community, require a non-empty reason
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
    }
  })
  // .refine(
  //   (data) => {
  //     if (data.fundingType?.includes("Community")) {
  //       return (
  //         data.reasonForJoiningCommunity &&
  //         data.reasonForJoiningCommunity.length > 0
  //       );
  //     }
  //     if (data.fundingType?.includes("Community")) {
  //       return (
  //         data.personalAmountFunding !== undefined &&
  //         data.personalAmountFunding > 0
  //       );
  //     }
  //     return true;
  //   },
  //   {
  //     message: "Required",
  //     path: ["reasonForJoiningCommunity"],
  //   }
  // )
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
    }
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
    }
  )
  .superRefine((data, ctx) => {
    // Helper that checks membership whether fundingType is string or string[]
    const has = (needle: string) => {
      const ft = data.fundingType;
      if (!ft) return false;
      return ft.includes(needle);
    };

    const triggered = has("Business") || has("Personal");
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
    value: "Knowledge Community",
    label: "Knowledge Community",
    type: "Community",
  },
  {
    value: "Auto Loan",
    label: "Auto Loan",
    type: "Personal And Business",
  },
  {
    value: "Equipment Financing",
    label: "Equipment Financing",
    type: "Personal And Business",
  },
];

export type FundingProductType = (typeof FundingProductTypeEnum)[number];

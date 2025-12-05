import { z } from "zod";
import { dateOfBirthSchema, GenderEnum, ROLESEnum } from ".";

// Strict SSN validator with normalization
export const ssnSchema = z
  .string({ error: "Required" })
  .trim()
  // Require exactly "xxx-xx-xxxx"
  .regex(/^\d{3}-\d{2}-\d{4}$/, { message: "Enter a valid SSN" })
  .superRefine((value, ctx) => {
    const digits = value.replace(/\D/g, ""); // "AAAGGSSSS"
    const area = Number(digits.slice(0, 3)); // AAA
    const group = Number(digits.slice(3, 5)); // GG
    const serial = Number(digits.slice(5)); // SSSS

    // Disallow 000, 666, and 900–999 area numbers
    if (area === 0 || area === 666 || area >= 900) {
      ctx.addIssue({ code: "custom", message: "Enter a valid SSN" });
    }
    // Disallow 00 group and 0000 serial
    if (group === 0 || serial === 0) {
      ctx.addIssue({ code: "custom", message: "Enter a valid SSN" });
    }
  })
  // Return canonical format AAA-GG-SSSS
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  });

export const passwordSchema = z
  .string()
  .min(8, { message: "8 minimum characters" })
  .regex(/[A-Z]/, { message: "Require uppercase character" })
  .regex(/[a-z]/, { message: "Require lowercase character" })
  .regex(/[0-9]/, { message: "Require numeric character" })
  // If you don't want spaces to count as special, use /[^\w\s]/ instead:
  .regex(/[^\w\s]/, { message: "Require special character" });

export const UserActiveStatusEnum = z.enum(["Active", "InActive", "Paused"]);

export type UserActiveStatus = z.infer<typeof UserActiveStatusEnum>;
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;

export type User = z.infer<typeof registrationSchema>;
export const registrationSchema = z.object({
  firstName: z.string().min(1, { error: "Required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { error: "Required" }),
  email: z.email().min(1, { error: "Required" }),
  password: passwordSchema,
  birthdate: dateOfBirthSchema,
  gender: GenderEnum,
  phoneNumber: z.string().min(1, { error: "Required" }),
  role: ROLESEnum.optional(),
  isOnboarded: z.boolean().optional(),
  registrationDate: z.date().optional(),
  ssn: ssnSchema,
  activeStatus: UserActiveStatusEnum.optional(),
  denefitsSignedUp: z.boolean().optional(),
  isBrokerInvite: z.boolean().optional(),
  commissionRate: z.coerce
    .number<number>()
    .min(0)
    .max(100)
    .default(10)
    .optional(),
  // Feature flags
  letterFeatureEnabled: z.boolean().default(false).optional(),
  latePaymentRemovalEnabled: z.boolean().default(false).optional(),
  unauthorizedInquiryRemovalEnabled: z.boolean().default(false).optional(),
  verifiedAccountDisputeEnabled: z.boolean().default(false).optional(),
  noResponseFollowUpEnabled: z.boolean().default(false).optional(),
  reinsertedAccountDisputeEnabled: z.boolean().default(false).optional(),
  accountErrorCorrectionEnabled: z.boolean().default(false).optional(),
  collectionAccountRemovalEnabled: z.boolean().default(false).optional(),
  fraudulentAccountRemovalEnabled: z.boolean().default(false).optional(),
});

export const UserFundMapStatus = z.enum(["New", "Processing"]);
export type UserFundMapStatus = z.infer<typeof UserFundMapStatus>;
export type UserWithId = User & {
  id: string;
  status: UserFundMapStatus;
  brokerId: string;
  brokerName: string;
};

export type UserPlaid = User & { plaidData?: PlaidAccessToken[]; id: string };

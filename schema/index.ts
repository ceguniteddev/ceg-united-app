import z from "zod";
import { auth as adminAuth } from "firebase-admin";
export const ROLES = ["Admin", "Broker", "Client"] as const;
export const ROLESEnum = z.enum(ROLES);

export type Role = z.infer<typeof ROLESEnum>;
export type AppRole = Exclude<Role, "Client">;

export const GenderEnum = z.enum(["Male", "Female", "Other"], {
  error: "Required",
});
export type Gender = z.infer<typeof GenderEnum>;

export const genderTypes = () => {
  const genderArray = GenderEnum.options;

  return genderArray.map((type) => ({
    value: type,
    label: type,
  }));
};

export const dateOfBirthSchema = z.coerce
  .date<Date>()
  .refine((date) => date <= new Date(), {
    message: "Date cannot be in the future",
  });

export const RequestCallStatus = ["Open", "Pending", "Resolved"] as const;
export const RequestCallStatusEnum = z.enum(RequestCallStatus);
export const getRequestCallStatus = () => {
  const dataArray = RequestCallStatusEnum.options;

  return dataArray.map((type) => ({
    value: type,
    label: type,
  }));
};

export const requestCallSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1, { error: "Required" }),
  email: z.email().min(1, { error: "Required" }),
  phoneNumber: z.string().min(1, { error: "Required" }),
  message: z.string().min(1, { error: "Required" }),
  status: RequestCallStatusEnum,
  remarks: z.string().optional(),
});

export type RequestCall = z.infer<typeof requestCallSchema>;

export type CurrentUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  role?: string | null; // from custom claims
  admin?: boolean; // from custom claims
  token: adminAuth.DecodedIdToken;
};

// export const businessSchmea = z.object({
//   id: z.string().optional(),
//   userId: z.string().optional(),
//   businessName: z.string().min(1, { error: "Required" }),
//   businessStreetAddress: z.string().min(1, { error: "Required" }),
//   businessCityAddress: z.string().min(1, { error: "Required" }),
//   businessStateAddress: z.string().min(1, { error: "Required" }),
//   businessPostalAddress: z
//     .string()
//     .trim()
//     .nonempty({ message: "Required" })
//     .regex(/^\d{5}$/, { message: "Must be exactly 5 digits" }),
//   businessPhoneNumber: z.string().min(1, { error: "Required" }),
//   businessEmail: z.email().min(1, { error: "Required" }),
//   businessDescription: z.string().min(1, { error: "Required" }),
//   businessWebsite: z.string().min(1, { error: "Required" }),
//   businessCategory: z.string().min(1, { error: "Required" }),
// });
// export type Business = z.infer<typeof businessSchmea>;

export const businessRecordSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(), // Made optional for registration context
  businessName: z.string().min(1, { message: "Required" }),
  businessStreetAddress: z.string().min(1, { message: "Required" }),
  businessStreetHouseNumber: z.string().optional(),
  businessCityAddress: z.string().min(1, { message: "Required" }),
  businessStateAddress: z.string().min(1, { message: "Required" }),
  businessPostalAddress: z.string().trim().nonempty({ message: "Required" }),
  // .regex(/^\d{5}$/, { message: "Must be exactly 5 digits" }),
  employerIdentificationNumber: z.string().min(1, { message: "Required" }),
  businessPhoneNumber: z.string().min(1, { message: "Required" }),
  businessEmail: z.email({ message: "Invalid email" }),
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
});

// What the DB stores / APIs expect:
export type Business = z.infer<typeof businessRecordSchema>;

// What the form edits (no userId here):
export const businessFormSchema = businessRecordSchema.omit({ userId: true });
export type BusinessForm = z.infer<typeof businessFormSchema>;

// ============================================================
// Business Detail — display/analytics types (not stored as-is)
// These types are used by the Business Detail tab views.
// ============================================================

export type AuditItemStatus =
  | "verified"
  | "warning"
  | "needs_update"
  | "pending";
export type CreditRating = "Poor" | "Fair" | "Good" | "Very Good" | "Excellent";

export interface AuditItem {
  id: string;
  label: string;
  value: string;
  status: AuditItemStatus;
  statusLabel: string;
  checkable: boolean;
}

export interface CreditAccount {
  id: string;
  type: string;
  balance: number;
  limit: number;
  status: "Current" | "Past Due" | "Closed";
  age: string;
}

export interface FinancialMetric {
  id: string;
  label: string;
  value: string;
  status: "Healthy" | "Moderate" | "At Risk" | "Verified";
  icon: string;
}

export interface TradelineSuggestion {
  id: string;
  name: string;
  benefit: string;
  recommendedLimit: string;
  type: string;
  impactScore: number;
}

export interface CompatibilityFactor {
  id: string;
  label: string;
  met: boolean;
  detail: string;
}

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Apply the error to the confirmPassword field
  });
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export interface UploadedFileData {
  originalFilename: string;
  gcsPath: string;
  size: number;
  contentType: string;
  publicUrl?: string;
}

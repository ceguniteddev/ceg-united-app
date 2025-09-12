import z from "zod";
import { auth as adminAuth } from "firebase-admin";
export const ROLES = ["Admin", "IT", "Staff", "Client"] as const;
export const ROLESEnum = z.enum(ROLES);

export type Role = z.infer<typeof ROLESEnum>;
export type AppRole = Exclude<Role, "Client">;

export const GenderEnum = z.enum(["Male", "Female", "Other"], { error: "Required" });
export type Gender = z.infer<typeof GenderEnum>;

export const genderTypes = () => {
  const genderArray = GenderEnum.options;

  return genderArray.map((type) => ({
    value: type,
    label: type,
  }));
};

export const dateOfBirthSchema = z
  .date({ error: "Required" })
  .refine((date) => date <= new Date(), { message: "Date cannot be in the future" });

export const getMessage = (error: z.ZodError) => {
  const flat = error.flatten();
  const fieldErrors = flat.fieldErrors;
  const formErrors = flat.formErrors;

  const fieldMessages = Object.values(fieldErrors).flat();

  const allMessages = [...fieldMessages, ...formErrors];

  return allMessages.length > 0 ? allMessages : ["Invalid request body"];
};

export const RequestCallStatus = ["New", "Resolved"] as const;
export const RequestCallStatusEnum = z.enum(RequestCallStatus);

export const requestCallSchema = z.object({
  fullName: z.string().min(1, { error: "Required" }),
  email: z.email().min(1, { error: "Required" }),
  phoneNumber: z.string().min(1, { error: "Required" }),
  message: z.string().min(1, { error: "Required" }),
  status: RequestCallStatusEnum,
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
  userId: z.string().min(1, { message: "Required" }),
  businessName: z.string().min(1, { message: "Required" }),
  businessStreetAddress: z.string().min(1, { message: "Required" }),
  businessCityAddress: z.string().min(1, { message: "Required" }),
  businessStateAddress: z.string().min(1, { message: "Required" }),
  businessPostalAddress: z
    .string()
    .trim()
    .nonempty({ message: "Required" })
    .regex(/^\d{5}$/, { message: "Must be exactly 5 digits" }),
  employerIdentificationNumber: z.string().min(1, { message: "Required" }),
  businessPhoneNumber: z.string().min(1, { message: "Required" }),
  businessEmail: z.email({ message: "Invalid email" }),
  businessWebsite: z.string({ error: "Required" }).optional(),
  socialMedia: z.string({ error: "Required" }).optional(),
  lastYearTaxes: z.number().optional(),
  currentYearTaxes: z.number().optional(),
});

// What the DB stores / APIs expect:
export type Business = z.infer<typeof businessRecordSchema>;

// What the form edits (no userId here):
export const businessFormSchema = businessRecordSchema.omit({ userId: true });
export type BusinessForm = z.infer<typeof businessFormSchema>;

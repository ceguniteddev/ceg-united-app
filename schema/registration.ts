import { z } from "zod";
import { dateOfBirthSchema, GenderEnum, ROLESEnum } from ".";

export const passwordSchema = z
  .string()
  .min(8, { message: "8 minimum characters" })
  .regex(/[A-Z]/, { message: "Require uppercase character" })
  .regex(/[a-z]/, { message: "Require lowercase character" })
  .regex(/[0-9]/, { message: "Require numeric character" })
  // If you don't want spaces to count as special, use /[^\w\s]/ instead:
  .regex(/[^\w\s]/, { message: "Require special character" });

export const registrationSchema = z.object({
  firstName: z.string().min(1, { error: "Required" }),
  lastName: z.string().min(1, { error: "Required" }),
  email: z.email().min(1, { error: "Required" }),
  password: passwordSchema,
  birthdate: dateOfBirthSchema,
  gender: GenderEnum,
  phoneNumber: z.string().min(1, { error: "Required" }),
  role: ROLESEnum.optional(),
  isOnboarded: z.boolean().optional(),
  registrationDate: z.date().optional(),
  ssn: z.string().min(1, { error: "Required" }),
});
export type User = z.infer<typeof registrationSchema>;

export type UserPlaid = User & { plaidData?: PlaidAccessToken[] };

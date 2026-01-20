import { z } from "zod";
import { dateOfBirthSchema, GenderEnum, ROLESEnum } from ".";
import { ssnSchema, passwordSchema } from "./registration";

export const clientApplicationSchema = z
  .object({
    // Client Information
    firstName: z.string().min(1, { message: "Required" }),
    middleName: z.string().optional(),
    lastName: z.string().min(1, { message: "Required" }),
    email: z.email().min(1, { message: "Required" }),
    birthdate: z
      .date({ message: "Birthdate is required" })
      .refine((date) => date !== null && date !== undefined, {
        message: "Birthdate is required",
      })
      .refine((date) => date <= new Date(), {
        message: "Date cannot be in the future",
      }),
    gender: GenderEnum,
    phoneNumber: z.string().min(1, { message: "Required" }),
    role: ROLESEnum.optional(),
    isOnboarded: z.boolean().optional(),
    registrationDate: z.date().optional(),
    ssn: ssnSchema,
    password: passwordSchema.optional().or(z.literal("")),
    registrationType: z.enum(["client", "broker", "admin"]),
    consentConfirm: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.registrationType === "client") {
        return data.password && data.password.length > 0;
      }
      return true;
    },
    {
      message: "Required",
      path: ["password"],
    },
  );

export type ClientApplicationForm = z.infer<typeof clientApplicationSchema>;

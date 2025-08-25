import { z } from "zod";
import { dateOfBirthSchema, GenderEnum } from ".";

export type Registration = z.infer<typeof registrationSchema>;
export const registrationSchema = z.object({
  firstName: z.string().min(1, { error: "Required" }),
  lastName: z.string().min(1, { error: "Required" }),
  email: z.email().min(1, { error: "Required" }),
  password: z.string().min(1, { error: "Required" }),
  birthdate: dateOfBirthSchema,
  gender: GenderEnum,
});

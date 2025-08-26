import z from "zod";

function caseInsensitiveEnum<T extends readonly [string, ...string[]]>(values: T) {
  const lowerMap = Object.fromEntries(values.map((v) => [v.toLowerCase(), v]));

  return z
    .string()
    .transform((val) => lowerMap[val.toLowerCase()] || val)
    .refine((val) => values.includes(val as T[number]), {
      message: `Invalid enum value. Expected one of: ${values.join(", ")}`,
    });
}

export const ROLES = ["Admin", "IT", "Staff", "Client"] as const;
export const ROLESEnum = caseInsensitiveEnum(ROLES);

export type Role = (typeof ROLES)[number];
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

import z from "zod";

export const ROLES = ["Admin", "IT", "Staff", "Client"] as const;
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

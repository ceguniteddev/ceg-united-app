import z from "zod";

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

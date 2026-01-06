import z from "zod";

const RolesEnum = z.enum(["Admin", "Client", "Broker"]);

export const RegistrationTypesEnum = z.enum(["Self", "Broker", "Admin"]);
export type RegistrationType = z.infer<typeof RegistrationTypesEnum>;

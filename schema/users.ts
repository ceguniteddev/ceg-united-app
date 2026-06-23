import z from "zod";

const RolesEnum = z.enum(["Admin", "Client", "Broker"]);

export const RegistrationTypesEnum = z.enum(["Self", "Broker", "Admin"]);
export type RegistrationType = z.infer<typeof RegistrationTypesEnum>;

export type MembershipTier = "tier_starter" | "tier_pro" | "tier_executive";

export interface UserMembership {
  id: string;
  tier: MembershipTier;
  amount: number;
  status: string;
  checkoutId?: string | null;
  createdAt: string | null;
  canceledAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

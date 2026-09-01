import z from "zod";

const RolesEnum = z.enum(["Admin", "Client", "Broker"]);

export const RegistrationTypesEnum = z.enum(["Self", "Broker", "Admin"]);
export type RegistrationType = z.infer<typeof RegistrationTypesEnum>;

export type LegacyMembershipTier =
  | "tier_starter"
  | "tier_pro"
  | "tier_executive";

export type MembershipTier = LegacyMembershipTier | "platform_access";
export type MembershipAccessModel = "legacy_tier" | "platform_course";

export type MembershipProviderStatus =
  | "pending"
  | "active"
  | "on_hold"
  | "paused"
  | "cancelled"
  | "failed"
  | "expired";

export type MembershipEntitlementStatus = "paid" | "grace" | "free";

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
  provider?: "dodo" | null;
  providerStatus?: MembershipProviderStatus | null;
  entitlementStatus?: MembershipEntitlementStatus | null;
  effectivePlan?: MembershipTier | "free";
  subscriptionId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
  cancelAtNextBillingDate?: boolean;
  paymentFailureStartedAt?: string | null;
  retryAccessUntil?: string | null;
  nextReminderAt?: string | null;
  lastReminderAt?: string | null;
  reminderCount?: number;
  finalNoticeSentAt?: string | null;
  legacyBillingModel?: boolean;
  accessModel?: MembershipAccessModel | null;
  billingPlan?: MembershipTier | null;
}

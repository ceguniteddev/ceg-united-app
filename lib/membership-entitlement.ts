import type { UserMembership } from "@/schema/users";

const dateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const candidate = value as { toDate?: () => Date };
  if (typeof candidate.toDate === "function") return candidate.toDate();
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const hasPaidMembershipAccess = (
  membership: Pick<
    UserMembership,
    "status" | "entitlementStatus" | "retryAccessUntil"
  > | null,
  now = new Date(),
) => {
  if (!membership) return false;
  if (!membership.entitlementStatus) return membership.status === "active";
  if (membership.entitlementStatus === "paid") return true;
  if (membership.entitlementStatus !== "grace") return false;
  const deadline = dateValue(membership.retryAccessUntil);
  return Boolean(deadline && deadline.getTime() > now.getTime());
};

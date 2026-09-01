/// <reference types="vitest/globals" />
import { resolveClientEntitlements } from "@/lib/client-entitlements";
import type { UserCourseCapabilityGrant } from "@/schema/educational-materials/course";
import type { UserMembership } from "@/schema/users";

const membership = (
  overrides: Partial<UserMembership> = {},
): UserMembership => ({
  id: "current",
  tier: "platform_access",
  amount: 499,
  status: "active",
  entitlementStatus: "paid",
  accessModel: "platform_course",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const grant = (
  capabilityGrant: UserCourseCapabilityGrant["capabilityGrant"],
  courseKey: UserCourseCapabilityGrant["courseKey"],
): UserCourseCapabilityGrant => ({
  id: courseKey,
  userId: "u1",
  courseId: courseKey,
  courseKey,
  capabilityGrant,
  source: "dodo_webhook",
  status: "active",
  grantedAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("resolveClientEntitlements", () => {
  it("keeps income-based funding free and locks paid capabilities", () => {
    const result = resolveClientEntitlements({ membership: null });
    expect(result.hasIncomeFundingAccess).toBe(true);
    expect(result.hasPlatformAccess).toBe(false);
    expect(result.hasAnalysisAccess).toBe(false);
    expect(result.hasNonIncomeFundingAccess).toBe(false);
  });

  it("grants baseline access without legacy funding tools", () => {
    const result = resolveClientEntitlements({ membership: membership() });
    expect(result.hasPlatformAccess).toBe(true);
    expect(result.hasAuditAccess).toBe(true);
    expect(result.hasCreditReportAccess).toBe(true);
    expect(result.legacyPermissionLevel).toBe("none");
  });

  it("keeps disputes independent from cumulative funding levels", () => {
    const pro = resolveClientEntitlements({
      membership: membership(),
      courseGrants: [grant("legacy_pro", "funding_150k")],
    });
    expect(pro.legacyPermissionLevel).toBe("pro");
    expect(pro.hasDisputeAccess).toBe(false);

    const combined = resolveClientEntitlements({
      membership: membership(),
      courseGrants: [
        grant("legacy_executive", "funding_250k_plus"),
        grant("dispute", "credit_to_capital"),
      ],
    });
    expect(combined.legacyPermissionLevel).toBe("executive");
    expect(combined.hasDisputeAccess).toBe(true);
  });

  it("preserves active legacy tier permissions without rewriting data", () => {
    const legacy = membership({
      tier: "tier_pro",
      amount: 397,
      accessModel: undefined,
    });
    const before = structuredClone(legacy);
    const result = resolveClientEntitlements({ membership: legacy });
    expect(result.isLegacyMember).toBe(true);
    expect(result.legacyPermissionLevel).toBe("pro");
    expect(legacy).toEqual(before);
  });

  it("suppresses stored course grants when membership is terminal", () => {
    const result = resolveClientEntitlements({
      membership: membership({
        status: "inactive",
        entitlementStatus: "free",
      }),
      courseGrants: [grant("legacy_executive", "funding_250k_plus")],
    });
    expect(result.hasNonIncomeFundingAccess).toBe(false);
    expect(result.legacyPermissionLevel).toBe("none");
  });

  it("honors an unexpired grace window", () => {
    const result = resolveClientEntitlements({
      membership: membership({
        entitlementStatus: "grace",
        retryAccessUntil: "2026-02-01T00:00:00.000Z",
      }),
      now: new Date("2026-01-15T00:00:00.000Z"),
    });
    expect(result.hasPlatformAccess).toBe(true);
  });
});

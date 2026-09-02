import { hasPaidMembershipAccess } from "@/lib/membership-entitlement";
import type { UserCourseCapabilityGrant } from "@/schema/educational-materials/course";
import type { UserMembership } from "@/schema/users";

export type LegacyPermissionLevel = "none" | "starter" | "pro" | "executive";

export interface ClientEntitlements {
  hasPlatformAccess: boolean;
  hasIncomeFundingAccess: true;
  hasAuditAccess: boolean;
  hasAnalysisAccess: boolean;
  hasCreditReportAccess: boolean;
  hasNonIncomeFundingAccess: boolean;
  hasDisputeAccess: boolean;
  legacyPermissionLevel: LegacyPermissionLevel;
  isLegacyMember: boolean;
  evidence: string[];
}

const LEVEL_RANK: Record<LegacyPermissionLevel, number> = {
  none: 0,
  starter: 1,
  pro: 2,
  executive: 3,
};

const levelAtRank = (rank: number): LegacyPermissionLevel => {
  if (rank >= 3) return "executive";
  if (rank === 2) return "pro";
  if (rank === 1) return "starter";
  return "none";
};

const legacyLevelForMembership = (
  membership: UserMembership | null,
): LegacyPermissionLevel => {
  if (membership?.tier === "tier_executive") return "executive";
  if (membership?.tier === "tier_pro") return "pro";
  if (membership?.tier === "tier_starter") return "starter";
  return "none";
};

const levelForGrant = (
  grant: UserCourseCapabilityGrant["capabilityGrant"],
): LegacyPermissionLevel => {
  if (grant === "legacy_executive") return "executive";
  if (grant === "legacy_pro") return "pro";
  if (grant === "legacy_starter") return "starter";
  return "none";
};

export const resolveClientEntitlements = ({
  membership,
  courseGrants = [],
  now = new Date(),
}: {
  membership: UserMembership | null;
  courseGrants?: UserCourseCapabilityGrant[];
  now?: Date;
}): ClientEntitlements => {
  const hasPlatformAccess = hasPaidMembershipAccess(membership, now);
  const isLegacyMember = Boolean(
    membership &&
    membership.accessModel !== "platform_course" &&
    membership.tier !== "platform_access",
  );

  if (!hasPlatformAccess) {
    return {
      hasPlatformAccess: false,
      hasIncomeFundingAccess: true,
      hasAuditAccess: false,
      hasAnalysisAccess: false,
      hasCreditReportAccess: false,
      hasNonIncomeFundingAccess: false,
      hasDisputeAccess: false,
      legacyPermissionLevel: "none",
      isLegacyMember,
      evidence: ["free"],
    };
  }

  const activeGrants = courseGrants.filter(
    (grant) => grant.status === "active",
  );
  const legacyLevel = legacyLevelForMembership(membership);
  const grantLevel = activeGrants.reduce<LegacyPermissionLevel>(
    (highest, grant) => {
      const candidate = levelForGrant(grant.capabilityGrant);
      return LEVEL_RANK[candidate] > LEVEL_RANK[highest] ? candidate : highest;
    },
    "none",
  );
  const legacyPermissionLevel = levelAtRank(
    Math.max(LEVEL_RANK[legacyLevel], LEVEL_RANK[grantLevel]),
  );
  const hasDisputeAccess = activeGrants.some(
    (grant) => grant.capabilityGrant === "dispute",
  );

  return {
    hasPlatformAccess: true,
    hasIncomeFundingAccess: true,
    hasAuditAccess: true,
    hasAnalysisAccess: true,
    hasCreditReportAccess: true,
    hasNonIncomeFundingAccess: legacyPermissionLevel !== "none",
    hasDisputeAccess,
    legacyPermissionLevel,
    isLegacyMember,
    evidence: [
      isLegacyMember ? `legacy:${legacyLevel}` : "membership:platform_access",
      ...activeGrants.map(
        (grant) => `course:${grant.courseKey}:${grant.capabilityGrant}`,
      ),
    ],
  };
};

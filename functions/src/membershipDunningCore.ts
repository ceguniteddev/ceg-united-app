export const MEMBERSHIP_REMINDER_INTERVAL_MS = 48 * 60 * 60 * 1000;

export type DunningAction = "skip" | "remind" | "observe_expired" | "downgrade";

export const getMembershipDunningAction = ({
  entitlementStatus,
  nextReminderAt,
  retryAccessUntil,
  now,
  enforce,
}: {
  entitlementStatus?: string;
  nextReminderAt?: Date | null;
  retryAccessUntil?: Date | null;
  now: Date;
  enforce: boolean;
}): DunningAction => {
  if (
    entitlementStatus !== "grace" ||
    !nextReminderAt ||
    nextReminderAt.getTime() > now.getTime()
  ) {
    return "skip";
  }
  if (retryAccessUntil && retryAccessUntil.getTime() <= now.getTime()) {
    return enforce ? "downgrade" : "observe_expired";
  }
  return "remind";
};

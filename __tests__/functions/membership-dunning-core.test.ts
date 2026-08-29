/// <reference types="vitest/globals" />

import {
  getMembershipDunningAction,
  MEMBERSHIP_REMINDER_INTERVAL_MS,
} from "@/functions/src/membershipDunningCore";

describe("membership dunning schedule", () => {
  const now = new Date("2026-01-14T00:00:00.000Z");

  it("does not send before a reminder is due", () => {
    expect(
      getMembershipDunningAction({
        entitlementStatus: "grace",
        nextReminderAt: new Date(now.getTime() + 1),
        retryAccessUntil: new Date(now.getTime() + 1000),
        now,
        enforce: true,
      }),
    ).toBe("skip");
    expect(MEMBERSHIP_REMINDER_INTERVAL_MS).toBe(48 * 60 * 60 * 1000);
  });

  it("sends due reminders inside the retry window", () => {
    expect(
      getMembershipDunningAction({
        entitlementStatus: "grace",
        nextReminderAt: new Date(now.getTime() - 1),
        retryAccessUntil: new Date(now.getTime() + 1),
        now,
        enforce: true,
      }),
    ).toBe("remind");
  });

  it("observes or enforces an expired retry window", () => {
    const input = {
      entitlementStatus: "grace",
      nextReminderAt: new Date(now.getTime() - 1),
      retryAccessUntil: new Date(now.getTime() - 1),
      now,
    };
    expect(getMembershipDunningAction({ ...input, enforce: false })).toBe(
      "observe_expired",
    );
    expect(getMembershipDunningAction({ ...input, enforce: true })).toBe(
      "downgrade",
    );
  });
});

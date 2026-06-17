import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkFreePullEligibility,
  getFreePullStatus,
} from "@/lib/crs-eligibility";

describe("crs-eligibility", () => {
  beforeEach(() => {
    // Lock the system time to June 18, 2026 for consistent testing of month/year logic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkFreePullEligibility()", () => {
    // Valid memberships
    const starterActive = { status: "active", tier: "tier_starter" };
    const proActive = { status: "active", tier: "tier_pro" };
    const execActive = { status: "active", tier: "tier_executive" };

    // Invalid memberships
    const inactiveStarter = { status: "inactive", tier: "tier_starter" };
    const nonEligibleTier = { status: "active", tier: "tier_free" };

    it("should return false if membership is missing", () => {
      expect(checkFreePullEligibility(null, null)).toBe(false);
      expect(checkFreePullEligibility(undefined, null)).toBe(false);
    });

    it("should return false if membership is not active", () => {
      expect(checkFreePullEligibility(inactiveStarter, null)).toBe(false);
    });

    it("should return false if membership tier is not starter, pro, or executive", () => {
      expect(checkFreePullEligibility(nonEligibleTier, null)).toBe(false);
    });

    it("should return true if eligible membership exists and lastFreePullAt is missing/null/undefined", () => {
      expect(checkFreePullEligibility(starterActive, null)).toBe(true);
      expect(checkFreePullEligibility(proActive, undefined)).toBe(true);
    });

    it("should return true if lastFreePullAt is invalid and cannot be parsed", () => {
      expect(
        checkFreePullEligibility(starterActive, "invalid-date-string"),
      ).toBe(true);
      expect(checkFreePullEligibility(starterActive, {})).toBe(true);
    });

    it("should return true if last pull was in a prior year", () => {
      // 2025-12-15 is a year before 2026-06-18
      const lastPull = new Date("2025-12-15T12:00:00.000Z");
      expect(checkFreePullEligibility(starterActive, lastPull)).toBe(true);
    });

    it("should return true if last pull was in a prior month of the same year", () => {
      // 2026-05-15 is a month before 2026-06-18
      const lastPull = new Date("2026-05-15T12:00:00.000Z");
      expect(checkFreePullEligibility(proActive, lastPull)).toBe(true);
    });

    it("should return false if last pull was in the current month and year", () => {
      // 2026-06-15 is the current month
      const lastPull = new Date("2026-06-15T12:00:00.000Z");
      expect(checkFreePullEligibility(execActive, lastPull)).toBe(false);
    });

    it("should handle Firestore Timestamp-like objects correctly", () => {
      // 2026-05-01 (prior month)
      const firestoreTsPrior = {
        toDate: () => new Date("2026-05-01T00:00:00.000Z"),
      };
      // 2026-06-10 (current month)
      const firestoreTsCurrent = {
        toDate: () => new Date("2026-06-10T00:00:00.000Z"),
      };

      expect(checkFreePullEligibility(starterActive, firestoreTsPrior)).toBe(
        true,
      );
      expect(checkFreePullEligibility(starterActive, firestoreTsCurrent)).toBe(
        false,
      );
    });

    it("should handle serializable JSON timestamp formats with 'seconds' correctly", () => {
      // Unix timestamp for 2026-05-15 is 1778889600 (prior month)
      const jsonTsPrior = { seconds: 1778889600 };
      // Unix timestamp for 2026-06-10 is 1781136000 (current month)
      const jsonTsCurrent = { seconds: 1781136000 };

      expect(checkFreePullEligibility(proActive, jsonTsPrior)).toBe(true);
      expect(checkFreePullEligibility(proActive, jsonTsCurrent)).toBe(false);
    });

    it("should handle serializable JSON timestamp formats with '_seconds' correctly", () => {
      // Unix timestamp for 2026-05-15 is 1778889600 (prior month)
      const jsonTsPrior = { _seconds: 1778889600 };
      // Unix timestamp for 2026-06-10 is 1781136000 (current month)
      const jsonTsCurrent = { _seconds: 1781136000 };

      expect(checkFreePullEligibility(proActive, jsonTsPrior)).toBe(true);
      expect(checkFreePullEligibility(proActive, jsonTsCurrent)).toBe(false);
    });

    it("should handle ISO strings and millisecond timestamps correctly", () => {
      // ISO string (prior month)
      expect(
        checkFreePullEligibility(execActive, "2026-05-20T10:00:00.000Z"),
      ).toBe(true);
      // ISO string (current month)
      expect(
        checkFreePullEligibility(execActive, "2026-06-15T10:00:00.000Z"),
      ).toBe(false);

      // Millisecond timestamp (prior month: 2026-05-15)
      expect(checkFreePullEligibility(execActive, 1778889600000)).toBe(true);
      // Millisecond timestamp (current month: 2026-06-15)
      expect(checkFreePullEligibility(execActive, 1781568000000)).toBe(false);
    });
  });

  describe("getFreePullStatus()", () => {
    const starterActive = { status: "active", tier: "tier_starter" };
    const inactiveStarter = { status: "inactive", tier: "tier_starter" };

    it("should return 'Not Eligible (No active membership)' if membership is not active or eligible", () => {
      expect(getFreePullStatus(null, null)).toBe(
        "Not Eligible (No active membership)",
      );
      expect(getFreePullStatus(inactiveStarter, null)).toBe(
        "Not Eligible (No active membership)",
      );
    });

    it("should return 'Available (1 free pull this month)' if eligible and has not pulled", () => {
      expect(getFreePullStatus(starterActive, null)).toBe(
        "Available (1 free pull this month)",
      );
    });

    it("should return 'Used this month (Last pull: [Formatted Date])' with default formatting if already pulled", () => {
      // 2026-06-10 (current month)
      const lastPull = new Date("2026-06-10T12:00:00.000Z");
      const expectedDateStr = lastPull.toLocaleDateString();

      expect(getFreePullStatus(starterActive, lastPull)).toBe(
        `Used this month (Last pull: ${expectedDateStr})`,
      );
    });

    it("should return 'Used this month (Last pull: [Formatted Date])' with custom formatDateFn if provided", () => {
      // 2026-06-10 (current month)
      const lastPull = new Date("2026-06-10T12:00:00.000Z");
      const customFormat = (date: Date) => {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
          date.getUTCDate(),
        ).padStart(2, "0")}`;
      };

      expect(getFreePullStatus(starterActive, lastPull, customFormat)).toBe(
        "Used this month (Last pull: 2026-06-10)",
      );
    });
  });
});

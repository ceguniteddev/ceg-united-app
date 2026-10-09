import { describe, it, expect } from "vitest";
import {
  computeClock,
  estimateReceipt,
  evidenceFor,
  evidenceStrength,
  selectNextSteps,
  noResponseAllowed,
  diffDays,
} from "@/lib/disputes/core";

describe("Dispute Module v3 Core Engine", () => {
  it("computes statutory deadlines accurately per 15 U.S.C. § 1681i", () => {
    const R = "2026-06-01"; // Monday
    const clock = computeClock({
      D0: "2026-05-28",
      R,
      rEstimated: false,
      extended: false,
      annualDisclosureRoute: false,
    });

    expect(clock.R).toBe("2026-06-01");
    // F is R + 5 business days
    expect(clock.F).toBe("2026-06-08");
    // C is R + 30 calendar days
    expect(clock.C).toBe("2026-07-01");
    // N is C + 5 business days (July 3 observed Independence Day holiday is skipped)
    expect(clock.N).toBe("2026-07-09");
    // OD is N + 5 business days
    expect(clock.OD).toBe("2026-07-16");
  });

  it("calculates estimated receipt for first-class mail", () => {
    const D0 = "2026-06-01"; // Monday
    const est = estimateReceipt(D0);
    expect(est.rEstimated).toBe(true);
    expect(est.R).toBe("2026-06-08"); // 5 business days
  });

  it("evaluates evidence strength correctly", () => {
    const specs = evidenceFor(["E04", "E05"], "en");
    expect(specs.length).toBeGreaterThan(0);

    const emptyStrength = evidenceStrength(specs, new Set());
    expect(emptyStrength.level).toBe("weak");
    expect(emptyStrength.pct).toBe(0);

    const decisiveKey = specs.find((s) => s.decisive)?.key;
    if (decisiveKey) {
      const strongStrength = evidenceStrength(specs, new Set([decisiveKey]));
      expect(strongStrength.pct).toBeGreaterThanOrEqual(80);
    }
  });

  it("evaluates noResponseAllowed gate based on date N", () => {
    const clock = computeClock({
      D0: "2026-05-28",
      R: "2026-06-01",
      rEstimated: false,
      extended: false,
      annualDisclosureRoute: false,
    });

    const mockLine: any = { clock };

    // Before N
    expect(noResponseAllowed(mockLine, "2026-06-15").allowed).toBe(false);
    // On or after N (2026-07-08)
    expect(noResponseAllowed(mockLine, "2026-07-08").allowed).toBe(true);
    expect(noResponseAllowed(mockLine, "2026-07-10").allowed).toBe(true);
  });
});

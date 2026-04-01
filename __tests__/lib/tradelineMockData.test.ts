import { describe, it, expect } from "vitest";
import {
  mockPersonalCreditBuilders,
  mockBusinessCreditBuilders,
} from "@/lib/tradelineMockData";

const VALID_BUREAUS = [
  "Experian",
  "TransUnion",
  "Equifax",
  "D&B",
  "Experian Business",
];

describe("mockPersonalCreditBuilders", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(mockPersonalCreditBuilders)).toBe(true);
    expect(mockPersonalCreditBuilders.length).toBeGreaterThan(0);
  });

  it("each item has all required properties", () => {
    for (const account of mockPersonalCreditBuilders) {
      expect(account).toHaveProperty("id");
      expect(account).toHaveProperty("name");
      expect(account).toHaveProperty("type");
      expect(account).toHaveProperty("provider");
      expect(account).toHaveProperty("description");
      expect(account).toHaveProperty("creditLimitRange");
      expect(account).toHaveProperty("monthlyFee");
      expect(account).toHaveProperty("reportsToBureaus");
      expect(account).toHaveProperty("timeToReport");
    }
  });

  it("all items have type === 'personal'", () => {
    for (const account of mockPersonalCreditBuilders) {
      expect(account.type).toBe("personal");
    }
  });

  it("all ids are unique strings", () => {
    const ids = mockPersonalCreditBuilders.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("reportsToBureaus is a non-empty array of valid bureau names", () => {
    for (const account of mockPersonalCreditBuilders) {
      expect(Array.isArray(account.reportsToBureaus)).toBe(true);
      expect(account.reportsToBureaus.length).toBeGreaterThan(0);
      for (const bureau of account.reportsToBureaus) {
        expect(VALID_BUREAUS).toContain(bureau);
      }
    }
  });
});

describe("mockBusinessCreditBuilders", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(mockBusinessCreditBuilders)).toBe(true);
    expect(mockBusinessCreditBuilders.length).toBeGreaterThan(0);
  });

  it("each item has all required properties", () => {
    for (const account of mockBusinessCreditBuilders) {
      expect(account).toHaveProperty("id");
      expect(account).toHaveProperty("name");
      expect(account).toHaveProperty("type");
      expect(account).toHaveProperty("provider");
      expect(account).toHaveProperty("description");
      expect(account).toHaveProperty("creditLimitRange");
      expect(account).toHaveProperty("monthlyFee");
      expect(account).toHaveProperty("reportsToBureaus");
      expect(account).toHaveProperty("timeToReport");
    }
  });

  it("all items have type === 'business'", () => {
    for (const account of mockBusinessCreditBuilders) {
      expect(account.type).toBe("business");
    }
  });

  it("all ids are unique strings", () => {
    const ids = mockBusinessCreditBuilders.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("reportsToBureaus is a non-empty array of valid bureau names", () => {
    for (const account of mockBusinessCreditBuilders) {
      expect(Array.isArray(account.reportsToBureaus)).toBe(true);
      expect(account.reportsToBureaus.length).toBeGreaterThan(0);
      for (const bureau of account.reportsToBureaus) {
        expect(VALID_BUREAUS).toContain(bureau);
      }
    }
  });
});

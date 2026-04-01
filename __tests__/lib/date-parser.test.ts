import { describe, it, expect } from "vitest";
import { normalizeDate, normalizeAllDates } from "@/lib/date-parser";

describe("normalizeDate()", () => {
  it("should return null for null input", () => {
    expect(normalizeDate(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(normalizeDate(undefined)).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(normalizeDate("")).toBeNull();
  });

  it("should return a Date as-is when already a Date instance", () => {
    const date = new Date("2024-01-15T00:00:00.000Z");
    const result = normalizeDate(date);
    expect(result).toBe(date);
  });

  it("should call .toDate() on Firestore Timestamp-like objects", () => {
    const firebaseTs = {
      toDate: () => new Date("2024-06-01T12:00:00.000Z"),
    };
    const result = normalizeDate(firebaseTs);
    expect(result).toEqual(new Date("2024-06-01T12:00:00.000Z"));
  });

  it("should parse a valid ISO date string", () => {
    const result = normalizeDate("2024-03-20T10:30:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2024-03-20T10:30:00.000Z");
  });

  it("should parse a locale date string", () => {
    const result = normalizeDate("January 1, 2024");
    expect(result).toBeInstanceOf(Date);
  });

  it("should return an invalid Date for unparseable strings (not null)", () => {
    const result = normalizeDate("not-a-date");
    // new Date("not-a-date") => invalid Date, not null
    expect(result).toBeInstanceOf(Date);
  });
});

describe("normalizeAllDates()", () => {
  it("should return primitive values unchanged", () => {
    expect(normalizeAllDates(42)).toBe(42);
    expect(normalizeAllDates("hello")).toBe("hello");
    expect(normalizeAllDates(null)).toBeNull();
  });

  it("should convert ISO date strings in objects", () => {
    const obj = { createdAt: "2024-01-15T00:00:00.000Z", name: "test" };
    const result = normalizeAllDates(obj);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.name).toBe("test");
  });

  it("should leave non-ISO strings untouched", () => {
    const obj = { label: "hello world" };
    const result = normalizeAllDates(obj);
    expect(result.label).toBe("hello world");
  });

  it("should convert Date instances in objects", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    const obj = { date };
    const result = normalizeAllDates(obj);
    expect(result.date).toBeInstanceOf(Date);
  });

  it("should convert Firestore Timestamp-like objects", () => {
    const ts = { toDate: () => new Date("2024-01-01T00:00:00.000Z") };
    const obj = { ts };
    const result = normalizeAllDates(obj);
    expect(result.ts).toBeInstanceOf(Date);
  });

  it("should recursively normalize nested objects", () => {
    const nested = {
      outer: {
        inner: { date: "2024-06-01T00:00:00.000Z" },
      },
    };
    const result = normalizeAllDates(nested);
    expect(result.outer.inner.date).toBeInstanceOf(Date);
  });

  it("should handle arrays correctly", () => {
    const arr = [
      { date: "2024-01-01T00:00:00.000Z" },
      { date: "2024-02-01T00:00:00.000Z" },
    ];
    const result = normalizeAllDates(arr);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[1].date).toBeInstanceOf(Date);
  });

  it("should not modify numbers in objects", () => {
    const obj = { count: 42 };
    const result = normalizeAllDates(obj);
    expect(result.count).toBe(42);
  });

  it("should handle empty objects", () => {
    expect(normalizeAllDates({})).toEqual({});
  });

  it("should handle empty arrays", () => {
    expect(normalizeAllDates([])).toEqual([]);
  });
});

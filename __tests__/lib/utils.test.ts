import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cn,
  formatAmount,
  parseStringify,
  countTransactionCategories,
  decryptId,
} from "@/lib/utils";

// formUrlQuery uses window.location which requires a browser env – tested separately
describe("cn()", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "skipped", "kept")).toBe("base kept");
  });

  it("should resolve Tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("should return empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("should handle undefined and null values", () => {
    expect(cn(undefined, null, "valid")).toBe("valid");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});

describe("formatAmount()", () => {
  it("should format a whole number with two decimal places", () => {
    expect(formatAmount(1000)).toBe("1,000.00");
  });

  it("should format a decimal number correctly", () => {
    expect(formatAmount(1234.56)).toBe("1,234.56");
  });

  it("should return 0 for NaN input", () => {
    expect(formatAmount(NaN)).toBe(0);
  });

  it("should return 0 for 0 input (falsy guard)", () => {
    expect(formatAmount(0)).toBe(0);
  });

  it("should format large numbers with commas", () => {
    expect(formatAmount(1000000)).toBe("1,000,000.00");
  });

  it("should format negative numbers", () => {
    expect(formatAmount(-500)).toBe("-500.00");
  });
});

describe("parseStringify()", () => {
  it("should deep clone a plain object", () => {
    const original = { a: 1, b: { c: 2 } };
    const clone = parseStringify(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
  });

  it("should deep clone an array", () => {
    const arr = [1, 2, { x: 3 }];
    const clone = parseStringify(arr);
    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
  });

  it("should strip undefined values (JSON behaviour)", () => {
    const obj = { a: 1, b: undefined };
    expect(parseStringify(obj)).toEqual({ a: 1 });
  });

  it("should handle primitive strings", () => {
    expect(parseStringify("hello")).toBe("hello");
  });

  it("should handle numbers", () => {
    expect(parseStringify(42)).toBe(42);
  });
});

describe("countTransactionCategories()", () => {
  const makeTransaction = (category: string): Transaction => ({
      category,
      $id: "",
      name: "",
      paymentChannel: "",
      type: "",
      accountId: "",
      amount: 0,
      pending: false,
      date: new Date().toISOString(),
      id: "",
      image: "",
      $createdAt: "",
      channel: "",
      senderBankId: "",
      receiverBankId: ""
  });

  it("should count single category correctly", () => {
    const transactions = [
      makeTransaction("Food"),
      makeTransaction("Food"),
      makeTransaction("Food"),
    ];
    const result = countTransactionCategories(transactions);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "Food", count: 3, totalCount: 3 });
  });

  it("should count multiple categories and sort by count descending", () => {
    const transactions = [
      makeTransaction("Food"),
      makeTransaction("Travel"),
      makeTransaction("Food"),
      makeTransaction("Travel"),
      makeTransaction("Travel"),
    ];
    const result = countTransactionCategories(transactions);
    expect(result[0].name).toBe("Travel");
    expect(result[0].count).toBe(3);
    expect(result[1].name).toBe("Food");
    expect(result[1].count).toBe(2);
    expect(result[0].totalCount).toBe(5);
  });

  it("should return empty array for empty input", () => {
    expect(countTransactionCategories([])).toEqual([]);
  });

  it("should handle null/undefined transactions gracefully", () => {
    // The function guards with `transactions &&`
    expect(() =>
      countTransactionCategories(null as unknown as Transaction[]),
    ).not.toThrow();
  });

  it("should set totalCount on each item", () => {
    const transactions = [makeTransaction("A"), makeTransaction("B")];
    const result = countTransactionCategories(transactions);
    result.forEach((item) => expect(item.totalCount).toBe(2));
  });
});

describe("decryptId()", () => {
  it("should decode a base64 string", () => {
    const original = "hello-world";
    const encoded = btoa(original);
    expect(decryptId(encoded)).toBe(original);
  });

  it("should decode a standard base64 string", () => {
    expect(decryptId("dGVzdA==")).toBe("test");
  });
});

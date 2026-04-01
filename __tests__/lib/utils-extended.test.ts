import { describe, it, expect } from "vitest";
import {
  formatDateTime,
  getTransactionStatus,
  removeSpecialCharacters,
  getStockStatus,
  getStockColor,
  getStockLabel,
  getPurchaseStatusColor,
  getTimeLeft,
  getTagColor,
  formatDateShort,
  stripHtml,
  getAccountTypeColors,
  currency,
} from "@/lib/utils";

describe("formatDateTime", () => {
  it("returns an object with all date fields", () => {
    const result = formatDateTime(new Date("2024-03-15T14:30:00"));
    expect(result).toHaveProperty("dateTime");
    expect(result).toHaveProperty("dateDay");
    expect(result).toHaveProperty("dateOnly");
    expect(result).toHaveProperty("timeOnly");
  });

  it("dateTime contains month and year", () => {
    const result = formatDateTime(new Date("2024-03-15T14:30:00"));
    expect(result.dateTime).toMatch(/2024/);
    expect(result.dateTime).toMatch(/Mar/);
  });

  it("timeOnly contains time components", () => {
    const result = formatDateTime(new Date("2024-03-15T14:30:00"));
    expect(result.timeOnly).toMatch(/:/);
    expect(result.timeOnly).toMatch(/(AM|PM)/);
  });
});

describe("getTransactionStatus", () => {
  it("returns 'Processing' for a date within 2 days", () => {
    const recent = new Date();
    recent.setHours(recent.getHours() - 1);
    expect(getTransactionStatus(recent)).toBe("Processing");
  });

  it("returns 'Success' for a date older than 2 days", () => {
    const old = new Date();
    old.setDate(old.getDate() - 5);
    expect(getTransactionStatus(old)).toBe("Success");
  });

  it("returns 'Processing' for today", () => {
    expect(getTransactionStatus(new Date())).toBe("Processing");
  });
});

describe("removeSpecialCharacters", () => {
  it("removes special characters from string", () => {
    expect(removeSpecialCharacters("Hello, World!")).toBe("Hello World");
  });

  it("keeps alphanumeric characters and spaces", () => {
    expect(removeSpecialCharacters("abc123")).toBe("abc123");
  });

  it("removes punctuation", () => {
    expect(removeSpecialCharacters("test@email.com")).toBe("testemailcom");
  });

  it("returns empty string for all-special input", () => {
    expect(removeSpecialCharacters("!@#$%^&*()")).toBe("");
  });
});

describe("getStockStatus", () => {
  it("returns 'out-of-stock' for 0", () => {
    expect(getStockStatus(0)).toBe("out-of-stock");
  });

  it("returns 'low-stock' for 1", () => {
    expect(getStockStatus(1)).toBe("low-stock");
  });

  it("returns 'low-stock' for 2", () => {
    expect(getStockStatus(2)).toBe("low-stock");
  });

  it("returns 'in-stock' for 3", () => {
    expect(getStockStatus(3)).toBe("in-stock");
  });

  it("returns 'in-stock' for large quantity", () => {
    expect(getStockStatus(100)).toBe("in-stock");
  });
});

describe("getStockColor", () => {
  it("returns gray classes for out of stock", () => {
    expect(getStockColor(0)).toContain("gray");
  });

  it("returns amber classes for low stock", () => {
    expect(getStockColor(1)).toContain("amber");
  });

  it("returns emerald classes for in stock", () => {
    expect(getStockColor(5)).toContain("emerald");
  });
});

describe("getStockLabel", () => {
  it("returns 'Out of Stock' for 0", () => {
    expect(getStockLabel(0)).toBe("Out of Stock");
  });

  it("returns 'Only N left' for low stock", () => {
    expect(getStockLabel(1)).toBe("Only 1 left");
    expect(getStockLabel(2)).toBe("Only 2 left");
  });

  it("returns 'N in stock' for normal stock", () => {
    expect(getStockLabel(10)).toBe("10 in stock");
  });
});

describe("getPurchaseStatusColor", () => {
  it("returns emerald classes for approved", () => {
    const color = getPurchaseStatusColor("approved");
    expect(color).toContain("emerald");
  });

  it("returns amber classes for pending", () => {
    const color = getPurchaseStatusColor("pending");
    expect(color).toContain("amber");
  });

  it("returns red classes for declined", () => {
    const color = getPurchaseStatusColor("declined");
    expect(color).toContain("red");
  });

  it("returns gray classes for unknown status", () => {
    const color = getPurchaseStatusColor("unknown");
    expect(color).toContain("gray");
  });

  it("is case-insensitive", () => {
    expect(getPurchaseStatusColor("APPROVED")).toContain("emerald");
    expect(getPurchaseStatusColor("Pending")).toContain("amber");
  });
});

describe("getTimeLeft", () => {
  it("returns 'Expired' for a past date", () => {
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    expect(getTimeLeft(past)).toBe("Expired");
  });

  it("returns days and hours for future date > 1 day away", () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = getTimeLeft(future);
    expect(result).toMatch(/\dd \dh left/);
  });

  it("returns hours and minutes for future date < 1 day away", () => {
    const future = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const result = getTimeLeft(future);
    expect(result).toMatch(/\dh \dm left/);
  });

  it("returns '0d 0h left' for just-over-zero time", () => {
    // 25 hours away = 1d 1h
    const future = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
    const result = getTimeLeft(future);
    expect(result).toContain("d");
    expect(result).toContain("h left");
  });
});

describe("getTagColor", () => {
  it("returns red classes for Flash Sale", () => {
    expect(getTagColor("Flash Sale")).toContain("red");
  });

  it("returns amber classes for Limited Time", () => {
    expect(getTagColor("Limited Time")).toContain("amber");
  });

  it("returns emerald classes for Best Value", () => {
    expect(getTagColor("Best Value")).toContain("emerald");
  });

  it("returns blue classes for unknown tag", () => {
    expect(getTagColor("Other")).toContain("blue");
  });
});

describe("formatDateShort", () => {
  it("formats date as 'YYYY Mon'", () => {
    const result = formatDateShort(new Date("2015-03-01"));
    expect(result).toBe("2015 Mar");
  });

  it("accepts date string input", () => {
    const result = formatDateShort("2020-12-01");
    expect(result).toBe("2020 Dec");
  });

  it("formats current year correctly", () => {
    const result = formatDateShort(new Date("2024-07-15"));
    expect(result).toBe("2024 Jul");
  });
});

describe("stripHtml", () => {
  it("strips HTML tags from string (server-side regex path)", () => {
    // In node environment, typeof window === 'undefined', so regex path is taken
    expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe(
      "Hello World",
    );
  });

  it("strips anchor tags", () => {
    expect(stripHtml('<a href="https://example.com">Click here</a>')).toBe(
      "Click here",
    );
  });

  it("returns plain string unchanged", () => {
    expect(stripHtml("No HTML here")).toBe("No HTML here");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("handles nested tags", () => {
    expect(stripHtml("<div><p><span>Text</span></p></div>")).toBe("Text");
  });
});

describe("getAccountTypeColors", () => {
  it("returns blue colors for depository", () => {
    const colors = getAccountTypeColors("depository");
    expect(colors.bg).toContain("blue");
    expect(colors.title).toContain("blue");
  });

  it("returns success colors for credit", () => {
    const colors = getAccountTypeColors("credit");
    expect(colors.bg).toContain("success");
    expect(colors.title).toContain("success");
  });

  it("returns green colors for default/unknown type", () => {
    const colors = getAccountTypeColors("other" as any);
    expect(colors.bg).toContain("green");
    expect(colors.title).toContain("green");
  });

  it("returns objects with bg, lightBg, title, and subText properties", () => {
    const colors = getAccountTypeColors("depository");
    expect(colors).toHaveProperty("bg");
    expect(colors).toHaveProperty("lightBg");
    expect(colors).toHaveProperty("title");
    expect(colors).toHaveProperty("subText");
  });
});

describe("currency", () => {
  it("formats a number as USD currency", () => {
    expect(currency(1234.56)).toBe("$1,234.56");
  });

  it("formats integer values", () => {
    expect(currency(1000)).toBe("$1,000.00");
  });

  it("returns empty string for undefined", () => {
    expect(currency(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(currency(null)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(currency("")).toBe("");
  });

  it("returns empty string for NaN string", () => {
    expect(currency("not-a-number")).toBe("");
  });

  it("handles string numbers", () => {
    expect(currency("500.00")).toBe("$500.00");
  });

  it("formats zero correctly", () => {
    expect(currency(0)).toBe("$0.00");
  });
});

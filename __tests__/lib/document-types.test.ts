import { describe, it, expect, vi } from "vitest";

vi.mock("lucide-react", () => {
  const mockIcon = () => null;
  return {
    FileText: mockIcon,
    FileBadge: mockIcon,
    IdCard: mockIcon,
    Landmark: mockIcon,
    UserSquare: mockIcon,
    FileCheck2: mockIcon,
    FileKey2: mockIcon,
    Handshake: mockIcon,
    ShieldCheck: mockIcon,
    LineChart: mockIcon,
    Columns: mockIcon,
    Lightbulb: mockIcon,
    ReceiptText: mockIcon,
    ShieldAlert: mockIcon,
    CreditCard: mockIcon,
  };
});

import { DOCUMENT_TYPES } from "@/lib/document-types";

const VALID_CATEGORIES = ["universal", "personal", "business"] as const;

describe("DOCUMENT_TYPES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(DOCUMENT_TYPES)).toBe(true);
    expect(DOCUMENT_TYPES.length).toBeGreaterThan(0);
  });

  it("each item has all required properties", () => {
    for (const doc of DOCUMENT_TYPES) {
      expect(doc).toHaveProperty("id");
      expect(doc).toHaveProperty("title");
      expect(doc).toHaveProperty("description");
      expect(doc).toHaveProperty("icon");
      expect(doc).toHaveProperty("category");
      expect(doc).toHaveProperty("required");
    }
  });

  it("all ids are unique strings", () => {
    const ids = DOCUMENT_TYPES.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    for (const id of ids) {
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it("all categories are valid values", () => {
    for (const doc of DOCUMENT_TYPES) {
      expect(VALID_CATEGORIES).toContain(doc.category);
    }
  });

  it("required is always a boolean", () => {
    for (const doc of DOCUMENT_TYPES) {
      expect(typeof doc.required).toBe("boolean");
    }
  });

  it("contains specific required IDs", () => {
    const ids = DOCUMENT_TYPES.map((d) => d.id);
    expect(ids).toContain("DRIVERS_LICENSE");
    expect(ids).toContain("SSN_CARD");
    expect(ids).toContain("BANK_STATEMENTS");
    expect(ids).toContain("EIN_LETTER");
    expect(ids).toContain("ARTICLES_OF_ORGANIZATION");
  });

  it("DRIVERS_LICENSE is universal and required", () => {
    const item = DOCUMENT_TYPES.find((d) => d.id === "DRIVERS_LICENSE");
    expect(item).toBeDefined();
    expect(item!.category).toBe("universal");
    expect(item!.required).toBe(true);
  });

  it("EIN_LETTER is business and required", () => {
    const item = DOCUMENT_TYPES.find((d) => d.id === "EIN_LETTER");
    expect(item).toBeDefined();
    expect(item!.category).toBe("business");
    expect(item!.required).toBe(true);
  });

  it("PAYSTUBS is personal and not required", () => {
    const item = DOCUMENT_TYPES.find((d) => d.id === "PAYSTUBS");
    expect(item).toBeDefined();
    expect(item!.category).toBe("personal");
    expect(item!.required).toBe(false);
  });

  it("has at least some required and some optional items", () => {
    const required = DOCUMENT_TYPES.filter((d) => d.required);
    const optional = DOCUMENT_TYPES.filter((d) => !d.required);
    expect(required.length).toBeGreaterThan(0);
    expect(optional.length).toBeGreaterThan(0);
  });
});

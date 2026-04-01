import { describe, it, expect } from "vitest";
import { WhatsNewStatusEnum, whatsNewSchema } from "@/schema/whats-new";

describe("WhatsNewStatusEnum", () => {
  it("accepts Active", () => {
    expect(WhatsNewStatusEnum.safeParse("Active").success).toBe(true);
  });

  it("accepts InActive", () => {
    expect(WhatsNewStatusEnum.safeParse("InActive").success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(WhatsNewStatusEnum.safeParse("Inactive").success).toBe(false);
    expect(WhatsNewStatusEnum.safeParse("active").success).toBe(false);
    expect(WhatsNewStatusEnum.safeParse("").success).toBe(false);
  });
});

describe("whatsNewSchema", () => {
  const validEntry = {
    title: "New Feature Released",
    content: "We added a new dashboard widget.",
    status: true,
    createdAt: new Date("2024-01-15"),
  };

  it("accepts valid whats-new entry", () => {
    const result = whatsNewSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts optional id", () => {
    const withId = whatsNewSchema.safeParse({ ...validEntry, id: "entry-001" });
    expect(withId.success).toBe(true);

    const withoutId = whatsNewSchema.safeParse(validEntry);
    expect(withoutId.success).toBe(true);
  });

  it("accepts status false", () => {
    const result = whatsNewSchema.safeParse({ ...validEntry, status: false });
    expect(result.success).toBe(true);
  });

  it("rejects empty title (min 1)", () => {
    const result = whatsNewSchema.safeParse({ ...validEntry, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const { title: _, ...rest } = validEntry;
    expect(whatsNewSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty content (min 1)", () => {
    const result = whatsNewSchema.safeParse({ ...validEntry, content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const { content: _, ...rest } = validEntry;
    expect(whatsNewSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing status", () => {
    const { status: _, ...rest } = validEntry;
    expect(whatsNewSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing createdAt", () => {
    const { createdAt: _, ...rest } = validEntry;
    expect(whatsNewSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects non-boolean status", () => {
    expect(
      whatsNewSchema.safeParse({ ...validEntry, status: "Active" }).success,
    ).toBe(false);
  });
});

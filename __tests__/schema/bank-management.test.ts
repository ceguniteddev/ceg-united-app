import { describe, it, expect } from "vitest";
import { contactSchema, bankManagementSchema } from "@/schema/bank-management";

describe("contactSchema", () => {
  const validContact = {
    name: "John Smith",
    email: "john@example.com",
    phone: "555-123-4567",
  };

  it("accepts valid contact", () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = validContact;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty name", () => {
    expect(contactSchema.safeParse({ ...validContact, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects invalid email", () => {
    expect(
      contactSchema.safeParse({ ...validContact, email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _, ...rest } = validContact;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing phone", () => {
    const { phone: _, ...rest } = validContact;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty phone", () => {
    expect(
      contactSchema.safeParse({ ...validContact, phone: "" }).success,
    ).toBe(false);
  });
});

describe("bankManagementSchema", () => {
  const validContact = {
    name: "Jane Doe",
    email: "jane@bank.com",
    phone: "800-555-0100",
  };

  it("accepts valid bank with required fields", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
      contacts: [validContact],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid bank with website URL", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
      website: "https://www.communitybank.com",
      contacts: [validContact],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for website", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
      website: "",
      contacts: [validContact],
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined website (optional)", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
      contacts: [validContact],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
      website: "not-a-url",
      contacts: [validContact],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bankName", () => {
    const result = bankManagementSchema.safeParse({
      contacts: [validContact],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty bankName", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "",
      contacts: [validContact],
    });
    expect(result.success).toBe(false);
  });

  it("requires contacts array", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
    });
    expect(result.success).toBe(false);
  });

  it("validates contacts within array", () => {
    const result = bankManagementSchema.safeParse({
      bankName: "Community Bank",
      contacts: [{ name: "Bad", email: "not-email", phone: "123" }],
    });
    expect(result.success).toBe(false);
  });
});

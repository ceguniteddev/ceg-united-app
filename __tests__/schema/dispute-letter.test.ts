import { describe, it, expect } from "vitest";
import {
  DisputeLetterStatusEnum,
  DisputeTypeEnum,
  BureauEnum,
  RecipientTypeEnum,
  DisputedAccountSchema,
  LetterRecipientSchema,
  LetterDeliverySchema,
  DisputeLetterSchema,
} from "@/schema/dispute-letter";

describe("DisputeLetterStatusEnum", () => {
  const validStatuses = [
    "draft",
    "pending-review",
    "approved",
    "sent",
    "delivered",
    "responded",
    "resolved",
    "escalated",
  ];

  it.each(validStatuses)("accepts %s", (value) => {
    expect(DisputeLetterStatusEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(DisputeLetterStatusEnum.safeParse("closed").success).toBe(false);
    expect(DisputeLetterStatusEnum.safeParse("").success).toBe(false);
  });
});

describe("DisputeTypeEnum", () => {
  it("accepts reinserted-account", () => {
    expect(DisputeTypeEnum.safeParse("reinserted-account").success).toBe(true);
  });

  it("accepts inaccurate-information", () => {
    expect(DisputeTypeEnum.safeParse("inaccurate-information").success).toBe(
      true,
    );
  });

  it("rejects invalid type", () => {
    expect(DisputeTypeEnum.safeParse("identity-theft").success).toBe(false);
    expect(DisputeTypeEnum.safeParse("").success).toBe(false);
  });
});

describe("BureauEnum", () => {
  it.each(["Equifax", "Experian", "TransUnion"])("accepts %s", (value) => {
    expect(BureauEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid bureau", () => {
    expect(BureauEnum.safeParse("FICO").success).toBe(false);
  });
});

describe("RecipientTypeEnum", () => {
  it.each(["credit-bureau", "creditor", "collection-agency", "cfpb"])(
    "accepts %s",
    (value) => {
      expect(RecipientTypeEnum.safeParse(value).success).toBe(true);
    },
  );

  it("rejects invalid recipient type", () => {
    expect(RecipientTypeEnum.safeParse("attorney").success).toBe(false);
  });
});

describe("DisputedAccountSchema", () => {
  const validAccount = {
    accountName: "Chase Credit Card",
    creditorName: "JPMorgan Chase",
    disputeReason: "This account was removed and reinserted without notice",
    affectedBureaus: ["Equifax"] as const,
  };

  it("accepts valid disputed account", () => {
    const result = DisputedAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it("defaults previouslyRemoved to false", () => {
    const result = DisputedAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.previouslyRemoved).toBe(false);
    }
  });

  it("rejects empty accountName", () => {
    expect(
      DisputedAccountSchema.safeParse({ ...validAccount, accountName: "" })
        .success,
    ).toBe(false);
  });

  it("rejects empty creditorName", () => {
    expect(
      DisputedAccountSchema.safeParse({ ...validAccount, creditorName: "" })
        .success,
    ).toBe(false);
  });

  it("rejects empty disputeReason", () => {
    expect(
      DisputedAccountSchema.safeParse({ ...validAccount, disputeReason: "" })
        .success,
    ).toBe(false);
  });

  it("rejects affectedBureaus with fewer than 1 (min 1)", () => {
    expect(
      DisputedAccountSchema.safeParse({
        ...validAccount,
        affectedBureaus: [],
      }).success,
    ).toBe(false);
  });

  it("rejects invalid bureau in affectedBureaus", () => {
    expect(
      DisputedAccountSchema.safeParse({
        ...validAccount,
        affectedBureaus: ["InvalidBureau"],
      }).success,
    ).toBe(false);
  });
});

describe("LetterRecipientSchema", () => {
  const validRecipient = {
    recipientType: "credit-bureau" as const,
    name: "Equifax Information Services",
    addressLine1: "P.O. Box 740256",
    city: "Atlanta",
    state: "GA",
    postalCode: "30374",
  };

  it("accepts valid recipient", () => {
    const result = LetterRecipientSchema.safeParse(validRecipient);
    expect(result.success).toBe(true);
  });

  it("defaults isDefault to false", () => {
    const result = LetterRecipientSchema.safeParse(validRecipient);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
    }
  });

  it("accepts valid 5+4 postal code (12345-6789)", () => {
    expect(
      LetterRecipientSchema.safeParse({
        ...validRecipient,
        postalCode: "12345-6789",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid postal code format", () => {
    expect(
      LetterRecipientSchema.safeParse({
        ...validRecipient,
        postalCode: "1234",
      }).success,
    ).toBe(false);
    expect(
      LetterRecipientSchema.safeParse({
        ...validRecipient,
        postalCode: "ABCDE",
      }).success,
    ).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = validRecipient;
    expect(LetterRecipientSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing addressLine1", () => {
    const { addressLine1: _, ...rest } = validRecipient;
    expect(LetterRecipientSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing city", () => {
    const { city: _, ...rest } = validRecipient;
    expect(LetterRecipientSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing state", () => {
    const { state: _, ...rest } = validRecipient;
    expect(LetterRecipientSchema.safeParse(rest).success).toBe(false);
  });
});

describe("LetterDeliverySchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = LetterDeliverySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial delivery data", () => {
    const result = LetterDeliverySchema.safeParse({
      letterId: "ls-12345",
      status: "in-transit",
      trackingNumber: "USPS123",
    });
    expect(result.success).toBe(true);
  });
});

describe("DisputeLetterSchema", () => {
  const validLetter = {
    userId: "user-abc-123",
    disputeType: "inaccurate-information" as const,
    letterTitle: "Dispute: Inaccurate Balance",
    letterContent: "<p>I am writing to dispute...</p>",
  };

  it("accepts valid dispute letter", () => {
    const result = DisputeLetterSchema.safeParse(validLetter);
    expect(result.success).toBe(true);
  });

  it("defaults status to draft", () => {
    const result = DisputeLetterSchema.safeParse(validLetter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("defaults aiGenerated to false", () => {
    const result = DisputeLetterSchema.safeParse(validLetter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aiGenerated).toBe(false);
    }
  });

  it("rejects missing userId", () => {
    const { userId: _, ...rest } = validLetter;
    expect(DisputeLetterSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty letterTitle", () => {
    expect(
      DisputeLetterSchema.safeParse({ ...validLetter, letterTitle: "" })
        .success,
    ).toBe(false);
  });

  it("rejects empty letterContent", () => {
    expect(
      DisputeLetterSchema.safeParse({ ...validLetter, letterContent: "" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid disputeType", () => {
    expect(
      DisputeLetterSchema.safeParse({
        ...validLetter,
        disputeType: "identity-theft",
      }).success,
    ).toBe(false);
  });
});

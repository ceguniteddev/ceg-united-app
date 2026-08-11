import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(),
  authenticationAdmin: vi.fn(),
  initFirebase: vi.fn(),
}));

import {
  GeneratePlaybookRequestSchema,
  NearestBranchesRequestSchema,
  ReconsiderationScriptRequestSchema,
  SavePlaybookFeedbackRequestSchema,
  validateApprovalRangeWithinBand,
} from "@/lib/funding-playbook/schemas";

describe("Funding Playbook Schemas & Validation", () => {
  it("validates GeneratePlaybookRequestSchema correctly", () => {
    const valid = {
      clientId: "client_123",
      lenderId: "chase",
      productId: "ink-business-preferred",
    };
    expect(GeneratePlaybookRequestSchema.safeParse(valid).success).toBe(true);

    const invalid = { clientId: "" };
    expect(GeneratePlaybookRequestSchema.safeParse(invalid).success).toBe(
      false,
    );
  });

  it("validates NearestBranchesRequestSchema correctly", () => {
    const valid = {
      zip: "32601",
      lenderId: "chase",
      radiusMiles: 25,
    };
    expect(NearestBranchesRequestSchema.safeParse(valid).success).toBe(true);

    const invalidZip = { zip: "123", lenderId: "chase" };
    expect(NearestBranchesRequestSchema.safeParse(invalidZip).success).toBe(
      false,
    );
  });

  it("validates ReconsiderationScriptRequestSchema correctly", () => {
    const valid = {
      clientId: "client_123",
      lenderId: "chase",
      denialReason: "too many recent inquiries",
    };
    expect(ReconsiderationScriptRequestSchema.safeParse(valid).success).toBe(
      true,
    );
  });

  it("validates SavePlaybookFeedbackRequestSchema correctly", () => {
    const valid = {
      playbookId: "client_123_chase_ink-business-preferred",
      clientId: "client_123",
      rating: 5,
      notes: "Worked great!",
    };
    expect(SavePlaybookFeedbackRequestSchema.safeParse(valid).success).toBe(
      true,
    );
  });

  it("enforces approval range band clamping logic (±30%)", () => {
    const documentedBand: [number, number] = [10000, 50000];

    // Valid range within band [7000, 65000]
    expect(
      validateApprovalRangeWithinBand([12000, 45000], documentedBand),
    ).toBe(true);

    // Invalid range below lower bound (< 7000)
    expect(validateApprovalRangeWithinBand([5000, 45000], documentedBand)).toBe(
      false,
    );

    // Invalid range above upper bound (> 65000)
    expect(
      validateApprovalRangeWithinBand([12000, 70000], documentedBand),
    ).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockAdd = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

const mockDocRef = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};
const mockCollectionRef = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  get: mockGet,
};
mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);

const mockDb = { collection: vi.fn().mockReturnValue(mockCollectionRef) };

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("@/service/email-verification", () => ({
  generateEmailVerificationToken: vi.fn(),
}));

vi.mock("@/service/trigger-email", () => ({
  sendTriggerEmail: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/n8n", () => ({
  createAsanaTaskForLender: vi.fn(),
}));

import { resendVerificationEmail } from "@/service/user";
import { generateEmailVerificationToken } from "@/service/email-verification";
import { sendTriggerEmail } from "@/service/trigger-email";
import { authenticationAdmin } from "@/lib/fireabase-admin";
import AppError from "@/error/AppError";

describe("resendVerificationEmail service function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it("should throw AppError if user does not exist in Firestore", async () => {
    mockGet.mockResolvedValue({
      exists: false,
    });

    await expect(resendVerificationEmail("u1")).rejects.toThrow(
      "User not found",
    );
  });

  it("should throw AppError if user is already verified in Firebase Auth", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "Client",
      }),
    });

    vi.mocked(authenticationAdmin).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({
        uid: "u1",
        email: "john@example.com",
        emailVerified: true,
      }),
    } as any);

    await expect(resendVerificationEmail("u1")).rejects.toThrow(
      "Email is already verified",
    );
  });

  it("should generate a token, generate the verification link, and send the email with USER_FUNDING_APPLICATION referenceNumber if available", async () => {
    // 1st get is for userDoc in Firestore
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "Client",
      }),
    });

    vi.mocked(authenticationAdmin).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({
        uid: "u1",
        email: "john@example.com",
        emailVerified: false,
      }),
    } as any);

    // 2nd get is for USER_FUNDING_APPLICATION where query
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "app-reference-123",
          data: () => ({}),
        },
      ],
    });

    vi.mocked(generateEmailVerificationToken).mockResolvedValue(
      "mock-verification-token",
    );
    vi.mocked(sendTriggerEmail).mockResolvedValue(undefined as any);

    const result = await resendVerificationEmail("u1");

    expect(result).toEqual({ success: true });
    expect(generateEmailVerificationToken).toHaveBeenCalledWith({
      userId: "u1",
      email: "john@example.com",
      referenceNumber: "app-reference-123",
      registrationType: "Self",
    });
    expect(sendTriggerEmail).toHaveBeenCalledOnce();
  });

  it("should pass undefined referenceNumber if USER_FUNDING_APPLICATION is not found", async () => {
    // 1st get is for userDoc in Firestore
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "Client",
      }),
    });

    vi.mocked(authenticationAdmin).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({
        uid: "u1",
        email: "john@example.com",
        emailVerified: false,
      }),
    } as any);

    // 2nd get is for USER_FUNDING_APPLICATION where query
    mockGet.mockResolvedValueOnce({
      empty: true,
    });

    vi.mocked(generateEmailVerificationToken).mockResolvedValue(
      "mock-verification-token",
    );
    vi.mocked(sendTriggerEmail).mockResolvedValue(undefined as any);

    const result = await resendVerificationEmail("u1");

    expect(result).toEqual({ success: true });
    expect(generateEmailVerificationToken).toHaveBeenCalledWith({
      userId: "u1",
      email: "john@example.com",
      referenceNumber: undefined,
      registrationType: "Self",
    });
  });
});

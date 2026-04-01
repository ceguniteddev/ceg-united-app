import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects ──────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

const mockCollectionRef: any = {
  add: mockAdd,
  doc: vi.fn(),
  where: mockWhere,
  orderBy: mockOrderBy,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts") },
}));
vi.mock("@/lib/plaid", () => ({ plaidClient: { userCreate: vi.fn() } }));
vi.mock("@/lib/encryption", () => ({
  encrypt: vi
    .fn()
    .mockReturnValue({ content: "encrypted-token", iv: "iv-123" }),
  decrypt: vi.fn().mockReturnValue("decrypted-token"),
}));
vi.mock("@/service/plaid", () => ({ getAccessToken: vi.fn() }));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { recordPlaidUserToken, getPlaidUserToken } from "@/service/plaid/data";
import { plaidClient } from "@/lib/plaid";

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
});

describe("getPlaidUserToken", () => {
  it("returns null when no token exists for the user", async () => {
    mockGet.mockResolvedValueOnce({ empty: true });
    const result = await getPlaidUserToken("user-1");
    expect(result).toBeNull();
  });

  it("returns decrypted token data when a token exists", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "token-doc-1",
          data: () => ({
            userId: "user-1",
            user_token: "encrypted-token",
            iv: "iv-123",
            user_id: "plaid-uid",
          }),
        },
      ],
    });
    const result = await getPlaidUserToken("user-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("token-doc-1");
    expect(result?.user_token).toBe("decrypted-token");
  });
});

describe("recordPlaidUserToken", () => {
  it("throws an error when userId is empty", async () => {
    await expect(recordPlaidUserToken("")).rejects.toThrow(
      "User id is required",
    );
  });

  it("returns the existing token without creating a new one", async () => {
    // getPlaidUserToken returns an existing token
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "token-doc-1",
          data: () => ({
            userId: "user-1",
            user_token: "encrypted-token",
            iv: "iv-123",
          }),
        },
      ],
    });

    const result = await recordPlaidUserToken("user-1");

    expect(result).toBeDefined();
    expect(result?.id).toBe("token-doc-1");
    expect(plaidClient.userCreate).not.toHaveBeenCalled();
  });

  it("creates and stores a new Plaid user token when none exists", async () => {
    // getPlaidUserToken returns empty (no existing token)
    mockGet.mockResolvedValueOnce({ empty: true });
    (plaidClient.userCreate as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        user_token: "new-plaid-token",
        user_id: "plaid-user-id",
        request_id: "req-abc",
      },
    });
    mockAdd.mockResolvedValueOnce(undefined);

    await recordPlaidUserToken("user-1");

    expect(plaidClient.userCreate).toHaveBeenCalledWith({
      client_user_id: "user-1",
    });
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        user_id: "plaid-user-id",
        request_id: "req-abc",
        user_token: "encrypted-token",
        iv: "iv-123",
        createdAt: "mock-ts",
      }),
    );
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// getPaymentRequestById calls firestoreAdmin() inside the function body,
// not at module level. vi.hoisted() is still used to share mock references
// between the vi.mock() factory and the test bodies.
const { mockGet, mockDocFn, mockDocRef, mockCollectionRef, mockDb } =
  vi.hoisted(() => {
    const mockGet = vi.fn();
    const mockDocFn = vi.fn();

    const mockDocRef: any = {
      get: mockGet,
    };

    const mockCollectionRef: any = {
      doc: mockDocFn,
      get: mockGet,
    };

    mockDocFn.mockReturnValue(mockDocRef);

    const mockDb: any = {
      collection: vi.fn().mockReturnValue(mockCollectionRef),
    };

    return { mockGet, mockDocFn, mockDocRef, mockCollectionRef, mockDb };
  });

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
}));

import { getPaymentRequestById } from "@/service/whop/utils";

describe("getPaymentRequestById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocFn.mockReturnValue(mockDocRef);
    mockDb.collection.mockReturnValue(mockCollectionRef);
  });

  it("returns null when the document does not exist", async () => {
    mockGet.mockResolvedValueOnce({
      exists: false,
      id: "p1",
      data: () => ({}),
    });

    const result = await getPaymentRequestById("p1");

    expect(result).toBeNull();
    expect(mockDb.collection).toHaveBeenCalledWith("whop-payment-requests");
    expect(mockDocFn).toHaveBeenCalledWith("p1");
  });

  it("returns the document data merged with its id when it exists", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      id: "p1",
      data: () => ({ amount: 500, status: "pending", userId: "u1" }),
    });

    const result = await getPaymentRequestById("p1");

    expect(result).toEqual({
      id: "p1",
      amount: 500,
      status: "pending",
      userId: "u1",
    });
  });

  it("returns null when Firestore throws an error", async () => {
    mockGet.mockRejectedValueOnce(new Error("permission-denied"));

    const result = await getPaymentRequestById("p1");

    expect(result).toBeNull();
  });
});

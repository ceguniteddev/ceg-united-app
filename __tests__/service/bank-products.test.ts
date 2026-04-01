import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects ──────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockAdd = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockCreate = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
  create: mockCreate,
  collection: vi.fn(),
};

const mockCollectionRef: any = {
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

const mockCollectionGroupRef: any = {
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  get: vi.fn(),
};

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
  collectionGroup: vi.fn().mockReturnValue(mockCollectionGroupRef),
  batch: vi.fn().mockReturnValue({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/service/user", () => ({
  getUserById: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/service/bank-management", () => ({ getBanks: vi.fn() }));
vi.mock("@/service/apply-funding", () => ({
  getApplyFundingByReferenceNumber: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));
vi.mock("@/service/n8n", () => ({ createAsanaCustomerServiceTask: vi.fn() }));
vi.mock("@/service/crs", () => ({
  getCRSReport: vi.fn(),
  getCRSBusinessProfile: vi.fn(),
}));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts") },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import {
  recordBankProduct,
  getBankProducts,
  getBankProduct,
  deleteBankProduct,
  updateBankProduct,
  deleteFundMappingAnalysis,
  removeBankProductFromMapping,
  updateClientApplicationStatus,
  approveMappedFund,
  cancelMappedFund,
} from "@/service/bank-products";
import { getCurrentUser } from "@/service/user";
import {
  getApplyFundingByReferenceNumber,
  updateApplicationStatus,
} from "@/service/apply-funding";
import NotFoundError from "@/error/NotFoundError";

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  // Restore persistent chain mocks after clearAllMocks
  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockCollectionRef.doc.mockReturnValue(mockDocRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
});

describe("recordBankProduct", () => {
  it("adds the bank product to the collection", async () => {
    mockAdd.mockResolvedValueOnce({ id: "new-id" });
    await recordBankProduct({ bankName: "Test Bank" } as any);
    expect(mockAdd).toHaveBeenCalledWith({ bankName: "Test Bank" });
  });
});

describe("getBankProducts", () => {
  it("returns empty array when collection is empty", async () => {
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
    const result = await getBankProducts();
    expect(result).toEqual({ success: true, data: [] });
  });

  it("returns data array when documents exist", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: "bp1", data: () => ({ bankName: "Bank A" }) },
        { id: "bp2", data: () => ({ bankName: "Bank B" }) },
      ],
    });
    const result = await getBankProducts();
    expect(result).toEqual({
      success: true,
      data: [
        { id: "bp1", bankName: "Bank A" },
        { id: "bp2", bankName: "Bank B" },
      ],
    });
  });

  it("returns success:false on Firestore error", async () => {
    mockGet.mockRejectedValueOnce(new Error("DB error"));
    const result = await getBankProducts();
    expect(result.success).toBe(false);
    expect((result as any).error).toBe("error");
  });
});

describe("getBankProduct", () => {
  it("returns null when document does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    const result = await getBankProduct("nonexistent-id");
    expect(result).toBeNull();
  });

  it("returns the bank product when document exists", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      id: "bp1",
      data: () => ({ bankName: "Bank A" }),
    });
    const result = await getBankProduct("bp1");
    expect(result).toEqual({ id: "bp1", bankName: "Bank A" });
  });
});

describe("deleteBankProduct", () => {
  it("throws NotFoundError when bank product does not exist", async () => {
    // Each rejects assertion calls deleteBankProduct → getBankProduct → mockGet once
    mockGet.mockResolvedValueOnce({ exists: false });
    await expect(deleteBankProduct("nonexistent-id")).rejects.toThrow(
      NotFoundError,
    );

    mockGet.mockResolvedValueOnce({ exists: false });
    await expect(deleteBankProduct("nonexistent-id")).rejects.toThrow(
      "Bank product not found.",
    );
  });

  it("deletes the bank product when it exists", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      id: "bp1",
      data: () => ({ bankName: "Bank A" }),
    });
    mockDelete.mockResolvedValueOnce(undefined);
    await deleteBankProduct("bp1");
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("updateBankProduct", () => {
  it("throws NotFoundError when bank product does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    await expect(
      updateBankProduct("nonexistent-id", {} as any),
    ).rejects.toThrow(NotFoundError);
  });

  it("sets new values when bank product exists", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      id: "bp1",
      data: () => ({ bankName: "Old Name" }),
    });
    mockSet.mockResolvedValueOnce(undefined);
    await updateBankProduct("bp1", { bankName: "Updated Name" } as any);
    expect(mockSet).toHaveBeenCalledWith({ bankName: "Updated Name" });
  });
});

describe("deleteFundMappingAnalysis", () => {
  it("deletes the document from the fund mapping subcollection", async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    await deleteFundMappingAnalysis("REF-001", "doc-123");
    expect(mockCollectionRef.doc).toHaveBeenCalledWith("doc-123");
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("removeBankProductFromMapping", () => {
  it("throws AppError when referenceNumber is empty", async () => {
    await expect(removeBankProductFromMapping("", "bp1")).rejects.toThrow(
      "Reference number is required.",
    );
  });

  it("throws AppError when bankProductId is empty", async () => {
    await expect(removeBankProductFromMapping("REF-001", "")).rejects.toThrow(
      "Bank product ID is required.",
    );
  });

  it("throws AppError when fund mapping document is not found", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    await expect(
      removeBankProductFromMapping("REF-001", "bp1"),
    ).rejects.toThrow("Fund mapping document not found.");
  });

  it("removes the specified bank product from the mapping array", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        bank_products: [{ id: "bp1" }, { id: "bp2" }, { id: "bp3" }],
      }),
    });
    mockUpdate.mockResolvedValueOnce(undefined);

    await removeBankProductFromMapping("REF-001", "bp1");

    expect(mockUpdate).toHaveBeenCalledWith({
      bank_products: [{ id: "bp2" }, { id: "bp3" }],
      updatedAt: "mock-ts",
    });
  });
});

describe("updateClientApplicationStatus", () => {
  it("throws AppError when the bank product is not found", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    await expect(
      updateClientApplicationStatus({
        userId: "u1",
        bankProductId: "bp1",
        status: "Applied" as any,
      }),
    ).rejects.toThrow("Bank product not found.");
  });

  it("updates the client application status when document exists", async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockUpdate.mockResolvedValueOnce(undefined);

    await updateClientApplicationStatus({
      userId: "u1",
      bankProductId: "bp1",
      status: "Applied" as any,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      clientApplicationStatus: "Applied",
    });
  });
});

describe("approveMappedFund", () => {
  it("returns error if referenceNumber is missing", async () => {
    const result = await approveMappedFund({
      referenceNumber: "",
      bankProductId: "bp1",
      products: [{}] as any,
    });
    expect(result.success).toBe(false);
  });
  it("returns error if products is empty", async () => {
    const result = await approveMappedFund({
      referenceNumber: "REF",
      bankProductId: "bp1",
      products: [],
    });
    expect(result.success).toBe(false);
  });
  it("returns error if funding app not found", async () => {
    vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(null as any);
    const result = await approveMappedFund({
      referenceNumber: "REF",
      bankProductId: "bp1",
      products: [{}] as any,
    });
    expect(result.success).toBe(false);
  });
  it("returns error if bank product not found", async () => {
    vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
      referenceNumber: "REF",
    } as any);
    mockGet.mockResolvedValueOnce({ exists: false }); // getBankProduct
    const result = await approveMappedFund({
      referenceNumber: "REF",
      bankProductId: "bp1",
      products: [{}] as any,
    });
    expect(result.success).toBe(false);
  });
  it("returns error if current user not found", async () => {
    vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
      referenceNumber: "REF",
    } as any);
    mockGet.mockResolvedValueOnce({
      exists: true,
      id: "bp1",
      data: () => ({ bankName: "Test" }),
    });
    vi.mocked(getCurrentUser).mockResolvedValue(null as any);
    const result = await approveMappedFund({
      referenceNumber: "REF",
      bankProductId: "bp1",
      products: [{}] as any,
    });
    expect(result.success).toBe(false);
  });
  it("creates new approval when none exists", async () => {
    vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
      referenceNumber: "REF",
      userId: "u1",
    } as any);
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        id: "bp1",
        data: () => ({ bankName: "Test" }),
      }) // getBankProduct
      .mockResolvedValueOnce({ empty: true, docs: [] }); // existing approvals query
    vi.mocked(getCurrentUser).mockResolvedValue({ uid: "admin1" } as any);
    vi.mocked(updateApplicationStatus).mockResolvedValue(undefined as any);
    const result = await approveMappedFund({
      referenceNumber: "REF",
      bankProductId: "bp1",
      products: [{}] as any,
    });
    expect(result.success).toBe(true);
    expect(mockAdd).toHaveBeenCalled();
  });
});

describe("cancelMappedFund", () => {
  it("returns error if fundMappingApprovedId is missing", async () => {
    const result = await cancelMappedFund({
      referenceNumber: "REF",
      fundMappingApprovedId: "",
    });
    expect(result.success).toBe(false);
  });
  it("returns error if referenceNumber is missing", async () => {
    const result = await cancelMappedFund({
      referenceNumber: "",
      fundMappingApprovedId: "f1",
    });
    expect(result.success).toBe(false);
  });
  it("returns error if funding app not found", async () => {
    vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(null as any);
    const result = await cancelMappedFund({
      referenceNumber: "REF",
      fundMappingApprovedId: "f1",
    });
    expect(result.success).toBe(false);
  });
  it("deletes and returns success", async () => {
    vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
      referenceNumber: "REF",
    } as any);
    vi.mocked(getCurrentUser).mockResolvedValue({ uid: "admin1" } as any);
    mockGet.mockResolvedValue({ exists: true });
    vi.mocked(updateApplicationStatus).mockResolvedValue(undefined as any);
    const result = await cancelMappedFund({
      referenceNumber: "REF",
      fundMappingApprovedId: "f1",
    });
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });
});

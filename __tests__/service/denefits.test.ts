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

const mockGetUserByEmail = vi.fn();
const mockAuthAdmin = { getUserByEmail: mockGetUserByEmail };

const mockDb = { collection: vi.fn().mockReturnValue(mockCollectionRef) };

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(() => mockAuthAdmin),
  storageAdmin: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getUserById: vi.fn(),
}));

import {
  recordContractCreated,
  getContracts,
  getContractsByUserId,
  getDenefitsPayments,
  updateDenefitsContractUserId,
  unmapDenefitsContract,
} from "@/service/denefits";
import { getUserById } from "@/service/user";
import AppError from "@/error/AppError";

const validDenefitsRequest = {
  contract_id: 101,
  contract_code: "CODE-ABC",
  customer_first_name: "Jane",
  customer_last_name: "Smith",
  customer_email: "jane@example.com",
};

describe("service/denefits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "contract-doc-id" });
    mockGet.mockResolvedValue({ docs: [] });
    mockWhere.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  describe("recordContractCreated", () => {
    it("throws AppError when denefitsRequest is invalid", async () => {
      await expect(
        recordContractCreated({ denefitsRequest: {} as any }),
      ).rejects.toThrow(AppError);
    });

    it("throws AppError when contract_code is missing", async () => {
      await expect(
        recordContractCreated({
          denefitsRequest: { contract_id: 1, customer_email: "a@b.com" } as any,
        }),
      ).rejects.toThrow(AppError);
    });

    it("stores contract with userId null when user is not found in Firebase Auth", async () => {
      mockGetUserByEmail.mockRejectedValue(new Error("User not found in auth"));
      await recordContractCreated({ denefitsRequest: validDenefitsRequest });
      expect(mockAdd).toHaveBeenCalledOnce();
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null }),
      );
    });

    it("returns null when user is not found in Firebase Auth", async () => {
      mockGetUserByEmail.mockRejectedValue(new Error("Not found"));
      const result = await recordContractCreated({
        denefitsRequest: validDenefitsRequest,
      });
      expect(result).toBeNull();
    });

    it("stores contract with userId null when getUserById returns null", async () => {
      mockGetUserByEmail.mockResolvedValue({ uid: "uid-123" });
      vi.mocked(getUserById).mockResolvedValue(null as any);
      await recordContractCreated({ denefitsRequest: validDenefitsRequest });
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null }),
      );
    });

    it("stores contract with uid when user is found", async () => {
      mockGetUserByEmail.mockResolvedValue({ uid: "uid-456" });
      vi.mocked(getUserById).mockResolvedValue({
        id: "uid-456",
        email: "jane@example.com",
      } as any);
      await recordContractCreated({ denefitsRequest: validDenefitsRequest });
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "uid-456" }),
      );
    });
  });

  describe("getContracts", () => {
    it("returns empty array when no contracts exist", async () => {
      mockGet.mockResolvedValue({ docs: [] });
      const result = await getContracts();
      expect(result).toEqual([]);
    });

    it("returns all contracts mapped from docs", async () => {
      mockGet.mockResolvedValue({
        docs: [
          {
            data: () => ({ contract_code: "A1", customer_email: "a@test.com" }),
          },
          {
            data: () => ({ contract_code: "B2", customer_email: "b@test.com" }),
          },
        ],
      });
      const result = await getContracts();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ contract_code: "A1" });
      expect(result[1]).toMatchObject({ contract_code: "B2" });
    });
  });

  describe("getContractsByUserId", () => {
    it("queries with userId filter", async () => {
      mockGet.mockResolvedValue({ docs: [] });
      await getContractsByUserId("user-xyz");
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-xyz");
    });

    it("returns empty array when no contracts for user", async () => {
      mockGet.mockResolvedValue({ docs: [] });
      const result = await getContractsByUserId("user-xyz");
      expect(result).toEqual([]);
    });

    it("returns contracts filtered by userId", async () => {
      mockGet.mockResolvedValue({
        docs: [{ data: () => ({ contract_code: "C3", userId: "user-xyz" }) }],
      });
      const result = await getContractsByUserId("user-xyz");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ userId: "user-xyz" });
    });
  });

  describe("getDenefitsPayments", () => {
    it("returns payments with mapped user data", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { id: "c1", data: () => ({ contract_code: "A", userId: "u1" }) },
        ],
      });
      vi.mocked(getUserById).mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        firstName: "Jane",
        lastName: "Doe",
      } as any);
      const result = await getDenefitsPayments();
      expect(result).toHaveLength(1);
      expect(result[0].mappedEmail).toBe("a@b.com");
      expect(result[0].mappedFirstName).toBe("Jane");
    });
    it("handles missing user gracefully", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { id: "c1", data: () => ({ contract_code: "A", userId: "u1" }) },
        ],
      });
      vi.mocked(getUserById).mockRejectedValue(new Error("Not found"));
      const result = await getDenefitsPayments();
      expect(result[0].mappedEmail).toBeNull();
    });
    it("returns null fields when userId is null", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { id: "c1", data: () => ({ contract_code: "A", userId: null }) },
        ],
      });
      const result = await getDenefitsPayments();
      expect(result[0].mappedEmail).toBeNull();
    });
  });

  describe("updateDenefitsContractUserId", () => {
    it("throws if contractId is missing", async () => {
      await expect(
        updateDenefitsContractUserId({ contractId: "", userId: "u1" }),
      ).rejects.toThrow(AppError);
    });
    it("throws if userId is missing", async () => {
      await expect(
        updateDenefitsContractUserId({ contractId: "c1", userId: "" }),
      ).rejects.toThrow(AppError);
    });
    it("throws if contract not found", async () => {
      mockGet.mockResolvedValue({ exists: false });
      await expect(
        updateDenefitsContractUserId({ contractId: "c1", userId: "u1" }),
      ).rejects.toThrow(AppError);
    });
    it("updates userId on success", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ contract_code: "A" }),
      });
      const result = await updateDenefitsContractUserId({
        contractId: "c1",
        userId: "u1",
      });
      expect(mockUpdate).toHaveBeenCalledWith({ userId: "u1" });
      expect(result.userId).toBe("u1");
    });
  });

  describe("unmapDenefitsContract", () => {
    it("throws if contractId is missing", async () => {
      await expect(unmapDenefitsContract({ contractId: "" })).rejects.toThrow(
        AppError,
      );
    });
    it("throws if contract not found", async () => {
      mockGet.mockResolvedValue({ exists: false });
      await expect(unmapDenefitsContract({ contractId: "c1" })).rejects.toThrow(
        AppError,
      );
    });
    it("sets userId to null on success", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ contract_code: "A" }),
      });
      const result = await unmapDenefitsContract({ contractId: "c1" });
      expect(mockUpdate).toHaveBeenCalledWith({ userId: null });
      expect(result.userId).toBeNull();
    });
  });
});

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

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => "mock-ts"),
    fromDate: vi.fn((d: any) => d),
  },
}));

vi.mock("@/service/crs", () => ({
  fundAnalysis: vi.fn(),
  generateCRSReport: vi.fn(),
  getCRSReport: vi.fn(),
  sendClientFundingApplicationAuditAnalysis: vi.fn(),
  sendClientFundingApplicationCongratsMessage: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

const { mockRandomBytes } = vi.hoisted(() => ({
  mockRandomBytes: vi.fn(() => ({
    toString: () => "mock-token-hex-string-32-bytes-long",
  })),
}));

vi.mock("crypto", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: { ...actual, randomBytes: mockRandomBytes },
    randomBytes: mockRandomBytes,
  };
});

import {
  generateEmailVerificationToken,
  verifyEmailToken,
  getVerificationTokenStatus,
} from "@/service/email-verification";
import { Timestamp } from "firebase-admin/firestore";
import { authenticationAdmin } from "@/lib/fireabase-admin";
import { getCRSReport, fundAnalysis, generateCRSReport } from "@/service/crs";

describe("service/email-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    vi.mocked(authenticationAdmin).mockReturnValue({
      updateUser: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  describe("generateEmailVerificationToken", () => {
    it("returns a token string", async () => {
      const token = await generateEmailVerificationToken({
        userId: "user-1",
        email: "user@example.com",
        registrationType: "Self",
      });
      expect(typeof token).toBe("string");
      expect(token).toBe("mock-token-hex-string-32-bytes-long");
    });

    it("calls doc(token).set with the correct data structure", async () => {
      await generateEmailVerificationToken({
        userId: "user-1",
        email: "user@example.com",
        registrationType: "Self",
      });
      expect(mockSet).toHaveBeenCalledOnce();
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg).toMatchObject({
        userId: "user-1",
        email: "user@example.com",
        token: "mock-token-hex-string-32-bytes-long",
        verified: false,
        registrationType: "Self",
      });
    });

    it("uses the token as the document id", async () => {
      const token = await generateEmailVerificationToken({
        userId: "user-2",
        email: "other@example.com",
        registrationType: "Broker",
      });
      expect(mockCollectionRef.doc).toHaveBeenCalledWith(token);
    });

    it("uses Timestamp.now() for createdAt", async () => {
      await generateEmailVerificationToken({
        userId: "user-1",
        email: "user@example.com",
        registrationType: "Self",
      });
      expect(vi.mocked(Timestamp.now)).toHaveBeenCalled();
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.createdAt).toBe("mock-ts");
    });

    it("uses Timestamp.fromDate() for expiresAt", async () => {
      await generateEmailVerificationToken({
        userId: "user-1",
        email: "user@example.com",
        registrationType: "Self",
      });
      expect(vi.mocked(Timestamp.fromDate)).toHaveBeenCalled();
    });

    it("stores verified as false by default", async () => {
      await generateEmailVerificationToken({
        userId: "user-1",
        email: "user@example.com",
        registrationType: "Self",
      });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.verified).toBe(false);
    });

    it("includes optional referenceNumber when provided", async () => {
      await generateEmailVerificationToken({
        userId: "user-1",
        email: "user@example.com",
        referenceNumber: "REF-XYZ",
        registrationType: "Self",
      });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.referenceNumber).toBe("REF-XYZ");
    });
  });

  describe("verifyEmailToken", () => {
    it("returns invalid message when token doc not found", async () => {
      mockGet.mockResolvedValue({ exists: false });
      const result = await verifyEmailToken("bad-token");
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/invalid/i);
    });
    it("returns success when already verified", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ verified: true, email: "a@b.com" }),
      });
      const result = await verifyEmailToken("token-1");
      expect(result.success).toBe(true);
      expect(result.email).toBe("a@b.com");
    });
    it("returns expired when token is past expiry", async () => {
      const pastDate = new Date(Date.now() - 100000);
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          verified: false,
          email: "a@b.com",
          expiresAt: { toDate: () => pastDate },
          userId: "u1",
        }),
      });
      const result = await verifyEmailToken("token-2");
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/expired/i);
    });
    it("verifies email successfully", async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          verified: false,
          email: "a@b.com",
          expiresAt: { toDate: () => futureDate },
          userId: "u1",
          registrationType: "Admin",
        }),
      });
      mockUpdate.mockResolvedValue(undefined);
      const result = await verifyEmailToken("token-3");
      expect(result.success).toBe(true);
      expect(result.email).toBe("a@b.com");
    });
    it("triggers CRS report for Self registration with referenceNumber", async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          verified: false,
          email: "a@b.com",
          expiresAt: { toDate: () => futureDate },
          userId: "u1",
          referenceNumber: "REF-001",
          registrationType: "Self",
        }),
      });
      mockUpdate.mockResolvedValue(undefined);
      vi.mocked(getCRSReport).mockResolvedValue(null as any);
      const result = await verifyEmailToken("token-4");
      expect(result.success).toBe(true);
      expect(vi.mocked(generateCRSReport)).toHaveBeenCalled();
      expect(vi.mocked(fundAnalysis)).toHaveBeenCalled();
    });
  });

  describe("getVerificationTokenStatus", () => {
    it("returns not exists when doc not found", async () => {
      mockGet.mockResolvedValue({ exists: false });
      const result = await getVerificationTokenStatus("bad");
      expect(result.exists).toBe(false);
    });
    it("returns verified status", async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          verified: true,
          email: "a@b.com",
          expiresAt: { toDate: () => futureDate },
        }),
      });
      const result = await getVerificationTokenStatus("tok");
      expect(result.exists).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.expired).toBe(false);
    });
    it("returns expired when past expiry", async () => {
      const pastDate = new Date(Date.now() - 100000);
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          verified: false,
          email: "a@b.com",
          expiresAt: { toDate: () => pastDate },
        }),
      });
      const result = await getVerificationTokenStatus("tok");
      expect(result.expired).toBe(true);
    });
  });
});

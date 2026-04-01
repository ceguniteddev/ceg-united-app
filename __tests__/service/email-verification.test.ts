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

vi.mock("crypto", () => ({
  randomBytes: vi.fn(() => ({
    toString: () => "mock-token-hex-string-32-bytes-long",
  })),
}));

import { generateEmailVerificationToken } from "@/service/email-verification";
import { Timestamp } from "firebase-admin/firestore";

describe("service/email-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
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
});

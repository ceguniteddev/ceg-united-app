import { describe, it, expect, vi, beforeEach } from "vitest";

// Standard Firestore mock pattern with collectionGroup support for getFundMappingApproved
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

// collectionGroup chain for getFundMappingApproved
const mockCollectionGroupGet = vi.fn();
const mockCollectionGroupRef = {
  orderBy: vi.fn(),
  where: vi.fn(),
  get: mockCollectionGroupGet,
};
mockCollectionGroupRef.orderBy.mockReturnValue(mockCollectionGroupRef);
mockCollectionGroupRef.where.mockReturnValue(mockCollectionGroupRef);

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
  collectionGroup: vi.fn().mockReturnValue(mockCollectionGroupRef),
};

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  getUserDocuments: vi.fn(),
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFunding: vi.fn(),
  getApplyFundingByReferenceNumber: vi.fn(),
  getFundingApplications: vi.fn(),
}));

vi.mock("@/service/bank-products", () => ({
  getFundMappingAnalysisDetails: vi.fn(),
  getFundMappingApproved: vi.fn(),
}));

vi.mock("@/service/business", () => ({
  getBusiness: vi.fn(),
}));

vi.mock("@/service/crs", () => ({
  getCRSReport: vi.fn(),
  getCRSBusinessScore: vi.fn(),
  getCRSBusinessProfile: vi.fn(),
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "ts") },
}));

import { getAdminStatistics, getClientStatistics } from "@/service/statistics";
import { getUsers, getUserById, getUserDocuments } from "@/service/user";
import {
  getApplyFunding,
  getFundingApplications,
} from "@/service/apply-funding";
import { getFundMappingAnalysisDetails } from "@/service/bank-products";
import { getBusiness } from "@/service/business";
import {
  getCRSReport,
  getCRSBusinessScore,
  getCRSBusinessProfile,
} from "@/service/crs";

describe("service/statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ docs: [] });
    mockCollectionGroupGet.mockResolvedValue({ docs: [] });
    mockCollectionGroupRef.orderBy.mockReturnValue(mockCollectionGroupRef);
    mockCollectionGroupRef.where.mockReturnValue(mockCollectionGroupRef);
  });

  describe("getAdminStatistics", () => {
    it("returns zero counts when there are no clients or funding applications", async () => {
      vi.mocked(getUsers).mockResolvedValue([] as any);
      vi.mocked(getFundingApplications).mockResolvedValue(null as any);

      const result = await getAdminStatistics();

      expect(result.totalClients).toBe(0);
      expect(result.totalFundingApplications).toBe(0);
      expect(result.totalApprovedApplications).toBe(0);
      expect(result.totalFundedApplications).toBe(0);
      expect(result.totalApprovedAmount).toBe(0);
      expect(result.totalFundedAmount).toBe(0);
    });

    it("returns correct total client count", async () => {
      vi.mocked(getUsers).mockResolvedValue([
        { id: "u1" },
        { id: "u2" },
        { id: "u3" },
      ] as any);
      vi.mocked(getFundingApplications).mockResolvedValue(null as any);

      const result = await getAdminStatistics();

      expect(result.totalClients).toBe(3);
    });

    it("returns correct total funding applications count", async () => {
      vi.mocked(getUsers).mockResolvedValue([] as any);
      vi.mocked(getFundingApplications).mockResolvedValue([
        { status: "Pending", addressState: "CA" },
        { status: "Approved", addressState: "NY" },
      ] as any);
      mockCollectionGroupGet.mockResolvedValue({ docs: [] });

      const result = await getAdminStatistics();

      expect(result.totalFundingApplications).toBe(2);
    });

    it("returns countsByState from funding applications", async () => {
      vi.mocked(getUsers).mockResolvedValue([] as any);
      vi.mocked(getFundingApplications).mockResolvedValue([
        { status: "Pending", addressState: "CA" },
        { status: "Pending", addressState: "CA" },
        { status: "Approved", addressState: "NY" },
      ] as any);
      mockCollectionGroupGet.mockResolvedValue({ docs: [] });

      const result = await getAdminStatistics();

      expect(result.countsByState).toMatchObject({ CA: 2, NY: 1 });
    });

    it("returns countsByStatus from funding applications", async () => {
      vi.mocked(getUsers).mockResolvedValue([] as any);
      vi.mocked(getFundingApplications).mockResolvedValue([
        { status: "Pending", addressState: "TX" },
        { status: "Approved", addressState: "TX" },
        { status: "Approved", addressState: "TX" },
      ] as any);
      mockCollectionGroupGet.mockResolvedValue({ docs: [] });

      const result = await getAdminStatistics();

      expect(result.countsByStatus).toMatchObject({ Pending: 1, Approved: 2 });
    });

    it("includes approved and funded totals from getFundMappingApproved", async () => {
      vi.mocked(getUsers).mockResolvedValue([] as any);
      vi.mocked(getFundingApplications).mockResolvedValue([] as any);
      mockCollectionGroupGet.mockResolvedValue({
        docs: [
          {
            id: "d1",
            data: () => ({
              clientApplicationStatus: "Approved",
              approvedAmount: "5000",
              fundedAmount: "0",
            }),
          },
          {
            id: "d2",
            data: () => ({
              clientApplicationStatus: "Funded",
              approvedAmount: "10000",
              fundedAmount: "10000",
            }),
          },
        ],
      });

      const result = await getAdminStatistics();

      expect(result.totalApprovedApplications).toBe(2);
      expect(result.totalFundedApplications).toBe(1);
      expect(result.totalApprovedAmount).toBe(15000);
      expect(result.totalFundedAmount).toBe(10000);
    });
  });

  describe("getClientStatistics", () => {
    beforeEach(() => {
      vi.mocked(getUserById).mockResolvedValue({
        id: "user-1",
        email: "u@test.com",
      } as any);
      vi.mocked(getUserDocuments).mockResolvedValue([] as any);
      vi.mocked(getApplyFunding).mockResolvedValue([] as any);
      vi.mocked(getFundMappingAnalysisDetails).mockResolvedValue([] as any);
      vi.mocked(getCRSReport).mockResolvedValue([] as any);
      vi.mocked(getBusiness).mockResolvedValue([] as any);
    });

    it("returns object with expected keys", async () => {
      const result = await getClientStatistics("user-1");

      expect(result).toHaveProperty("userData");
      expect(result).toHaveProperty("crsReportData");
      expect(result).toHaveProperty("fundingApplications");
      expect(result).toHaveProperty("approvedFunds");
      expect(result).toHaveProperty("businessesWithCrsData");
    });

    it("fetches user data by userId", async () => {
      await getClientStatistics("user-1");
      expect(vi.mocked(getUserById)).toHaveBeenCalledWith("user-1");
    });

    it("fetches funding applications for the user", async () => {
      await getClientStatistics("user-1");
      expect(vi.mocked(getApplyFunding)).toHaveBeenCalledWith("user-1");
    });

    it("fetches approved and funded mapping details", async () => {
      await getClientStatistics("user-1");
      expect(vi.mocked(getFundMappingAnalysisDetails)).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          clientApplicationStatus: ["Approved", "Funded"],
        }),
      );
    });

    it("fetches CRS report for the user", async () => {
      await getClientStatistics("user-1");
      expect(vi.mocked(getCRSReport)).toHaveBeenCalledWith("user-1");
    });

    it("returns empty businessesWithCrsData when user has no businesses", async () => {
      vi.mocked(getBusiness).mockResolvedValue([] as any);
      const result = await getClientStatistics("user-1");
      expect(result.businessesWithCrsData).toEqual([]);
    });

    it("enriches businesses with CRS profile and score data", async () => {
      vi.mocked(getBusiness).mockResolvedValue([
        { id: "biz-1", businessName: "Acme" },
      ] as any);
      vi.mocked(getCRSBusinessProfile).mockResolvedValue({
        report: { score: 80 },
      } as any);
      vi.mocked(getCRSBusinessScore).mockResolvedValue({
        report: { score: 80 },
      } as any);

      const result = await getClientStatistics("user-1");

      expect(result.businessesWithCrsData).toHaveLength(1);
      expect(result.businessesWithCrsData[0]).toHaveProperty(
        "crsBusinessProfile",
      );
      expect(result.businessesWithCrsData[0]).toHaveProperty(
        "crsBusinessScore",
      );
      expect(result.businessesWithCrsData[0]).toHaveProperty(
        "computedFundabilityScore",
      );
    });

    it("uses CRS score as computedFundabilityScore when available", async () => {
      vi.mocked(getBusiness).mockResolvedValue([
        { id: "biz-1", businessName: "TestCo" },
      ] as any);
      vi.mocked(getCRSBusinessScore).mockResolvedValue({
        report: { score: 75 },
      } as any);
      vi.mocked(getCRSBusinessProfile).mockResolvedValue(null as any);

      const result = await getClientStatistics("user-1");

      expect(result.businessesWithCrsData[0].computedFundabilityScore).toBe(75);
    });
  });
});

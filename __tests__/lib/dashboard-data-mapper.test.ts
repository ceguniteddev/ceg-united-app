import { describe, it, expect } from "vitest";
import { transformClientDataToDashboard } from "@/lib/dashboard-data-mapper";

// Minimal ClientData factory so tests are readable
function makeClientData(overrides: Record<string, any> = {}) {
  return {
    fundingApplications: [],
    crsReportData: [],
    businessesWithCrsData: [],
    getPlaidCompleteData: [],
    approvedFunds: [],
    ...overrides,
  } as any;
}

describe("transformClientDataToDashboard()", () => {
  it("should return null for null input", () => {
    expect(transformClientDataToDashboard(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(transformClientDataToDashboard(undefined)).toBeNull();
  });

  it("should return a DashboardData object for valid input", () => {
    const result = transformClientDataToDashboard(makeClientData());
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("fundingMetrics");
    expect(result).toHaveProperty("creditScores");
    expect(result).toHaveProperty("fundabilityScore");
    expect(result).toHaveProperty("financialSnapshot");
    expect(result).toHaveProperty("businesses");
    expect(result).toHaveProperty("nextSteps");
    expect(result).toHaveProperty("applicationStatus");
  });

  describe("fundingMetrics", () => {
    it("should calculate totalRequested from funding applications", () => {
      const clientData = makeClientData({
        fundingApplications: [
          { personalAmountFunding: 5000, businessAmountFunding: 10000 },
          { personalAmountFunding: 2000, businessAmountFunding: 3000 },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundingMetrics.totalRequested).toBe(20000);
    });

    it("should sum totalApproved from approvedFunds", () => {
      const clientData = makeClientData({
        approvedFunds: [{ approvedAmount: "5000" }, { approvedAmount: "3000" }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundingMetrics.totalApproved).toBe(8000);
    });

    it("should sum totalFunded from approvedFunds", () => {
      const clientData = makeClientData({
        approvedFunds: [{ fundedAmount: "2000" }, { fundedAmount: "1500" }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundingMetrics.totalFunded).toBe(3500);
    });

    it("should return 0 metrics with no applications or approved funds", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.fundingMetrics.totalRequested).toBe(0);
      expect(result.fundingMetrics.totalApproved).toBe(0);
      expect(result.fundingMetrics.totalFunded).toBe(0);
    });
  });

  describe("creditScores", () => {
    it("should always return all 3 bureaus", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      const bureaus = result.creditScores.map((s) => s.bureau);
      expect(bureaus).toContain("experian");
      expect(bureaus).toContain("equifax");
      expect(bureaus).toContain("transunion");
    });

    it("should fill missing bureaus with score=0 and rating=Poor", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      result.creditScores.forEach((score) => {
        expect(score.score).toBe(0);
        expect(score.rating).toBe("Poor");
      });
    });

    it("should parse a valid credit report", () => {
      const clientData = makeClientData({
        crsReportData: [
          {
            id: "experian-report-1",
            createdAt: "2024-01-01T00:00:00.000Z",
            report: {
              scores: [{ scoreValue: 750, sourceType: "Experian" }],
              creditFiles: [
                {
                  creditFileDetail: {
                    sourceType: "Experian",
                    fileNumber: "EX-12345",
                  },
                },
              ],
            },
          },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      const experian = result.creditScores.find(
        (s) => s.bureau === "experian",
      )!;
      expect(experian.score).toBe(750);
      expect(experian.rating).toBe("Very Good");
    });
  });

  describe("getRating (via creditScores)", () => {
    const scoreToRating = (scoreValue: number) => {
      const bureau = "experian";
      const clientData = makeClientData({
        crsReportData: [
          {
            id: "r1",
            report: {
              scores: [{ scoreValue, sourceType: "Experian" }],
              creditFiles: [
                {
                  creditFileDetail: {
                    sourceType: "Experian",
                    fileNumber: "XX",
                  },
                },
              ],
            },
          },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      return result.creditScores.find((s) => s.bureau === bureau)!.rating;
    };

    it("should rate 800+ as Excellent", () => {
      expect(scoreToRating(800)).toBe("Excellent");
      expect(scoreToRating(850)).toBe("Excellent");
    });

    it("should rate 740-799 as Very Good", () => {
      expect(scoreToRating(740)).toBe("Very Good");
      expect(scoreToRating(799)).toBe("Very Good");
    });

    it("should rate 670-739 as Good", () => {
      expect(scoreToRating(670)).toBe("Good");
      expect(scoreToRating(739)).toBe("Good");
    });

    it("should rate 580-669 as Fair", () => {
      expect(scoreToRating(580)).toBe("Fair");
      expect(scoreToRating(669)).toBe("Fair");
    });

    it("should rate below 580 as Poor", () => {
      expect(scoreToRating(579)).toBe("Poor");
      expect(scoreToRating(300)).toBe("Poor");
    });
  });

  describe("fundabilityScore", () => {
    it("should be 0 with no businesses", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.fundabilityScore.score).toBe(0);
    });

    it("should be 'Needs Improvement' status with score 0", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.fundabilityScore.status).toBe("Needs Improvement");
    });

    it("should compute average business fundability score", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [
          { computedFundabilityScore: 80 },
          { computedFundabilityScore: 60 },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundabilityScore.score).toBe(70); // (80+60)/2 rounded
    });

    it("should report Excellent when average >= 80", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [{ computedFundabilityScore: 85 }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundabilityScore.status).toBe("Excellent");
    });

    it("should report Good when average is 60-79", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [{ computedFundabilityScore: 65 }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundabilityScore.status).toBe("Good");
    });

    it("should report Fair when average is 40-59", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [{ computedFundabilityScore: 50 }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.fundabilityScore.status).toBe("Fair");
    });

    it("should have maxScore of 100", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.fundabilityScore.maxScore).toBe(100);
    });
  });

  describe("applicationStatus", () => {
    it("should count total applications", () => {
      const clientData = makeClientData({
        fundingApplications: [
          { status: "New" },
          { status: "Processing" },
          { status: "Approved" },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.applicationStatus.total).toBe(3);
    });

    it("should count New, Processing, Approved, Declined separately", () => {
      const clientData = makeClientData({
        fundingApplications: [
          { status: "New" },
          { status: "New" },
          { status: "Processing" },
          { status: "Approved" },
          { status: "Pre-Approved" },
          { status: "Declined" },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.applicationStatus.new).toBe(2);
      expect(result.applicationStatus.processing).toBe(1);
      expect(result.applicationStatus.approved).toBe(2); // Approved + Pre-Approved
      expect(result.applicationStatus.declined).toBe(1);
    });

    it("should return zeros with no applications", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.applicationStatus.total).toBe(0);
      expect(result.applicationStatus.new).toBe(0);
    });
  });

  describe("nextSteps", () => {
    it("should always return 3 steps", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.nextSteps).toHaveLength(3);
    });

    it("should mark upload bank step incomplete with no Plaid data", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      const step = result.nextSteps.find((s) => s.id === "step-1")!;
      expect(step.completed).toBe(false);
    });

    it("should mark upload bank step complete with Plaid data", () => {
      const clientData = makeClientData({
        getPlaidCompleteData: [{ transaction: [] }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      const step = result.nextSteps.find((s) => s.id === "step-1")!;
      expect(step.completed).toBe(true);
    });

    it("should mark business step complete when businesses exist", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [{ businessName: "Acme Corp" }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      const step = result.nextSteps.find((s) => s.id === "step-2")!;
      expect(step.completed).toBe(true);
    });

    it("should mark apply step complete when funding applications exist", () => {
      const clientData = makeClientData({
        fundingApplications: [{ status: "New" }],
      });
      const result = transformClientDataToDashboard(clientData)!;
      const step = result.nextSteps.find((s) => s.id === "step-3")!;
      expect(step.completed).toBe(true);
    });
  });

  describe("businesses", () => {
    it("should map businesses from businessesWithCrsData", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [
          {
            id: "biz-1",
            businessName: "Acme Corp",
            employerIdentificationNumber: "12-3456789",
            crsBusinessProfile: null,
            crsBusinessScore: null,
          },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.businesses).toHaveLength(1);
      expect(result.businesses[0].name).toBe("Acme Corp");
      expect(result.businesses[0].id).toBe("biz-1");
      expect(result.businesses[0].status).toBe("Pending"); // No crsBusinessProfile
    });

    it("should set status Active when crsBusinessProfile exists", () => {
      const clientData = makeClientData({
        businessesWithCrsData: [
          {
            id: "biz-2",
            businessName: "Active Inc",
            crsBusinessProfile: { report: {} },
            crsBusinessScore: null,
          },
        ],
      });
      const result = transformClientDataToDashboard(clientData)!;
      expect(result.businesses[0].status).toBe("Active");
    });

    it("should return empty array with no businesses", () => {
      const result = transformClientDataToDashboard(makeClientData())!;
      expect(result.businesses).toEqual([]);
    });
  });
});

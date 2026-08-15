import { describe, it, expect } from "vitest";

import {
  normalizeN8nOutput,
  normalizeChannelEnum,
  normalizeServiceEnum,
  assemblePlaybook,
} from "../../lib/funding-playbook/playbook-mapper";
import type {
  ClientProfile,
  Lender,
  Product,
  Branch,
} from "../../types/funding-playbook";

describe("playbook-mapper", () => {
  describe("normalizeN8nOutput", () => {
    it("unwraps output key from n8n response object", () => {
      const raw = {
        output: {
          section1_aiPersonalizedNote: "Hello Damani",
          section4_confidenceLevel: "Medium",
          section4_topDrivers: [
            {
              label: "Debt",
              detail: "High debt",
              weightPct: 40,
              impact: "Negative",
            },
          ],
        },
      };

      const normalized = normalizeN8nOutput(raw);
      expect(normalized.section1_aiPersonalizedNote).toBe("Hello Damani");
      expect(normalized.section4_confidenceLevel).toBe("medium");
      expect(normalized.section4_topDrivers[0].impact).toBe("negative");
    });

    it("unwraps array wrapped n8n response", () => {
      const raw = [
        {
          output: {
            section1_aiPersonalizedNote: "Test note",
            section4_confidenceLevel: "HIGH",
          },
        },
      ];

      const normalized = normalizeN8nOutput(raw);
      expect(normalized.section1_aiPersonalizedNote).toBe("Test note");
      expect(normalized.section4_confidenceLevel).toBe("high");
    });
  });

  describe("normalizeChannelEnum", () => {
    it("maps strings to valid ApplicationChannel enums", () => {
      expect(normalizeChannelEnum("Personal Term Loan / Line of Credit")).toBe(
        "online",
      );
      expect(normalizeChannelEnum("In Branch Application")).toBe("in_branch");
      expect(normalizeChannelEnum("Phone Call")).toBe("phone");
      expect(normalizeChannelEnum("Mobile App")).toBe("mobile_app");
    });
  });

  describe("normalizeServiceEnum", () => {
    it("maps service strings to CegServiceEnum", () => {
      expect(normalizeServiceEnum("CEG Credit Suite")).toBe("credit_repair");
      expect(normalizeServiceEnum("Tradelines")).toBe("tradelines");
      expect(normalizeServiceEnum("Income Coaching")).toBe("income_coaching");
      expect(normalizeServiceEnum("Business Formation")).toBe(
        "business_formation",
      );
    });
  });

  describe("assemblePlaybook", () => {
    it("assembles a valid nested Playbook object from normalized AI output and deterministic data", () => {
      const mockAiOutput = {
        section1_aiPersonalizedNote: "Personalized note for Damani",
        section1_recommendedHeadline: "Leverage Your Strong Personal Credit",
        section1_reasoning: "Your personal credit is strong.",
        section1_keyTakeaways: ["Takeaway 1", "Takeaway 2"],
        section1_otherChannels: [
          {
            channel: "in_branch",
            recommended: false,
            note: "Not recommended",
          },
        ],
        section1_decisionSpeedNote: "1-2 business days",
        section2_whyThisMatters: "Scores place you in Very Good tier",
        section3_ourRead: "Scores are strong across all 3 bureaus",
        section4_aiPersonalizedRange: [25000, 40000],
        section4_confidenceLevel: "medium",
        section4_confidencePct: 65,
        section4_aiReasoning: "Funding estimate based on FICO",
        section4_estimateNote: "Final approval amounts depend on income",
        section4_topDrivers: [
          {
            label: "High-Velocity New Debt",
            detail: "Added $103,000 in new loans",
            weightPct: 40,
            impact: "negative",
          },
        ],
        section5_aiRecommendedStatedIncome: 85000,
        section5_aiReasoning: "We recommend stating $85,000",
        section5_regulationBNote: "Regulation B info",
        section6_aiStructuringMath: "Revolving debt calculation",
        section6_aiRecommendation: "Pay off high utilization card",
        section7_aiClientSpecificRisks: ["High debt velocity"],
        section7_aiMitigationSteps: ["Stating strong income"],
        section8_recommendations: [
          {
            service: "credit_repair",
            rank: 1,
            aiApplicability: "Top recommendation",
            estimatedTimeToImpactDays: 90,
          },
        ],
        section10_aiPhoneScript:
          "Congratulations on maintaining strong credit...",
        section11_aiTimingRationale: "Apply within 1-3 business days",
        section13_aiClosingNote: "You have done an excellent job...",
      };

      const mockClient: ClientProfile = {
        id: "client-123",
        fullName: "Damani Test",
        email: "damani@example.com",
        phone: "555-0100",
        zip: "32601",
        fundingPath: "personal_loan",
        creditReports: [
          {
            bureau: "experian",
            score: 750,
            pulledAt: new Date().toISOString(),
            inquiriesLast6Months: 2,
            inquiriesLast24Months: 4,
            openTradelines: 10,
            oldestTradelineAgeMonths: 60,
            totalRevolvingLimit: 50000,
            totalRevolvingBalance: 5000,
            utilizationPct: 10,
            derogatoryMarks: [],
            publicRecords: [],
          },
        ],
        income: {
          employmentType: "w2_employee",
          statedAnnualIncome: 85000,
          verifiableAnnualIncome: 85000,
          monthlyGrossIncome: 7083,
          monthlyNetIncome: 5500,
          taxReturnsAvailable: true,
          bankStatementsAvailableMonths: 12,
        },
        dti: {
          monthlyDebtPayments: 1944,
          monthlyGrossIncome: 7083,
          dtiPct: 27,
          rentOrMortgageMonthly: 1500,
          rentOrMortgageIsReported: true,
        },
        existingLenderRelationships: [],
        cegServicesEnrolled: ["credit_repair"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockLender: Omit<Lender, "products"> = {
        id: "chase",
        displayName: "Chase Bank",
        type: "bank",
        primaryBureau: "experian",
        secondaryBureau: null,
        bureauPullNotes: "Pulls Experian for most credit cards",
        doubleDipFriendly: true,
        doubleDipRules: "Apply for 2 cards on same day",
        bankingRelationshipRequirements: {
          ddaRequired: false,
          notes: "No relationship required",
        },
        reconsiderationPhone: "1-800-432-3117",
        reconsiderationHours: "8am-8pm Mon-Fri",
        reconsiderationTips: "Be polite and explain recent inquiries",
        generalCustomerService: "1-800-935-9935",
        productPageBaseUrl: "https://chase.com",
        commonDenialReasons: ["Too many recent inquiries"],
        lastVerifiedAt: new Date().toISOString(),
      };

      const mockProduct: Product = {
        id: "chase-sapphire-preferred",
        displayName: "Chase Sapphire Preferred",
        productType: "personal_credit_card",
        applicationUrl: "https://chase.com/apply",
        typicalApprovalRange: [5000, 25000],
        minFICO: 680,
        denialReasons: ["High revolving utilization"],
        reconsiderationSuccessRate: 0.7,
        structuringAdvice: "Apply online",
        cegProductLift: { creditRepair: "+40 pts" },
        lastVerifiedAt: new Date().toISOString(),
      };

      const mockBranches: Branch[] = [
        {
          placeId: "place-1",
          name: "Chase Branch Gainesville",
          address: "123 Main St",
          lat: 29.6516,
          lng: -82.3248,
          distanceMiles: 1.2,
        },
      ];

      const playbook = assemblePlaybook({
        aiOutput: mockAiOutput,
        client: mockClient,
        lender: mockLender,
        product: mockProduct,
        branches: mockBranches,
      });

      expect(playbook.meta.clientId).toBe("client-123");
      expect(playbook.meta.lenderDisplayName).toBe("Chase Bank");
      expect(playbook.section1_bestMethod.recommendedHeadline).toBe(
        "Leverage Your Strong Personal Credit",
      );
      expect(playbook.section4_approvalEstimate.aiPersonalizedRange).toEqual([
        25000, 40000,
      ]);
      expect(playbook.section4_approvalEstimate.confidenceLevel).toBe("medium");
      expect(playbook.section9_nearestBranches.branches).toHaveLength(1);
      expect(
        playbook.section10_reconsiderationScript.reconsiderationPhone,
      ).toBe("1-800-432-3117");
      expect(playbook.section10_reconsiderationScript.aiPhoneScript).toContain(
        "Congratulations",
      );
    });
  });
});

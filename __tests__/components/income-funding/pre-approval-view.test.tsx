import React from "react";
import { render, screen } from "@testing-library/react";
import { PreApprovalView } from "@/components/income-funding/PreApprovalView";
import type { IncomeFundingDeal } from "@/types/income-funding-types";

vi.mock("@/components/funding/ClientActiveFundingList", () => ({
  default: () => (
    <div data-testid="client-active-funding-list">Funding List Mock</div>
  ),
}));

const mockDeal: IncomeFundingDeal = {
  id: "deal-1",
  coordinatorId: "coord-1",
  documents: [],
  offers: [],
  status: "prequalified",
  underwritingInput: {
    monthlyDeposits: 25000,
    timeInBusinessMonths: 24,
    averageDailyBalance: 12000,
    endingBalance: 8000,
    nsfCount: 0,
    negativeDays: 0,
    industryType: "Technology",
    creditScore: 720,
  },
  underwritingResult: {
    grade: "A",
    percentage: 1.0,
    baseMultiple: 1.5,
    multiplier: 1.5,
    maxFundingAmount: 135000,
    rationale: "Strong cash flow profile.",
  },
};

describe("PreApprovalView", () => {
  it("renders the hero card and active funding list", () => {
    render(
      <PreApprovalView
        deal={mockDeal}
        realDeal={{ referenceNumber: "REF-999" }}
        onContinue={vi.fn()}
        userId="user-123"
        referenceNumber="REF-999"
        isAdminView={false}
      />,
    );

    expect(screen.getByText("Continue to select your offer")).toBeDefined();
    expect(screen.getByTestId("client-active-funding-list")).toBeDefined();
    expect(screen.getByText("Your Applied Funding Products")).toBeDefined();
  });
});

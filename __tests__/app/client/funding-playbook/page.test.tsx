import React from "react";
import { render } from "@testing-library/react";
import ClientFundingPlaybookPage, {
  FundingPlaybookContent,
} from "@/app/(client)/client/funding-playbook/page";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";

vi.mock("@/provider/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/apply-funding", () => ({
  useGetUserApplyFunding: vi.fn(),
}));

vi.mock("@/hooks/admin/funding-application/fund-mapping", () => ({
  useClientMappedFundingDetailsQuery: vi.fn(),
}));

const { mockSearchParams } = vi.hoisted(() => ({
  mockSearchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    usePathname: () => "/",
    useSearchParams: () => mockSearchParams,
  };
});

vi.mock("@/components/funding-playbook/FundingPlaybookView", () => ({
  FundingPlaybookView: () => (
    <div data-testid="playbook-view">Playbook View</div>
  ),
}));

describe("ClientFundingPlaybookPage", () => {
  const mockAppliedFunding = [
    {
      referenceNumber: "REF-NEWEST",
      appliedDate: "2026-03-01T00:00:00.000Z",
      interestedProduct: "Business Loans",
      appliedPathways: [
        { pathwayId: "business_loan", status: "Pre-Approved" },
        { pathwayId: "income_based", status: "Pre-Approved" },
      ],
    },
    {
      referenceNumber: "REF-MATCH",
      appliedDate: "2026-02-01T00:00:00.000Z",
      interestedProduct: "Income-Based Funding",
      appliedPathways: [{ pathwayId: "income_based", status: "Pre-Approved" }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("referenceNumber");
    mockSearchParams.delete("pathwayId");
    mockSearchParams.delete("fundId");
    window.history.pushState({}, "", "/client/funding-playbook");
    (useAuth as any).mockReturnValue({
      user: { uid: "user-123" },
      userData: { firstName: "Damani" },
    });
    (useGetUserApplyFunding as any).mockReturnValue({
      appliedFunding: mockAppliedFunding,
      isLoading: false,
    });
    (useClientMappedFundingDetailsQuery as any).mockReturnValue({
      mappedFund: [],
      isLoading: false,
    });
  });

  it("preselects the application matching the initialReferenceNumber or query parameter", () => {
    render(<FundingPlaybookContent initialReferenceNumber="REF-MATCH" />);

    expect(useClientMappedFundingDetailsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceNumber: "REF-MATCH",
      }),
    );
  });

  it("preselects the pathway matching initialPathwayId when provided", () => {
    render(
      <FundingPlaybookContent
        initialReferenceNumber="REF-NEWEST"
        initialPathwayId="income_based"
      />,
    );

    expect(useClientMappedFundingDetailsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceNumber: "REF-NEWEST",
        pathwayId: "income_based",
      }),
    );
  });

  it("falls back to the newest application when query parameter is not present or invalid", () => {
    render(
      <FundingPlaybookContent initialReferenceNumber="NON_EXISTENT_REF" />,
    );

    expect(useClientMappedFundingDetailsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceNumber: "REF-NEWEST",
      }),
    );
  });

  it("renders the ClientFundingPlaybookPage wrapper without errors", () => {
    render(<ClientFundingPlaybookPage />);

    expect(useClientMappedFundingDetailsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceNumber: "REF-NEWEST",
      }),
    );
  });
});

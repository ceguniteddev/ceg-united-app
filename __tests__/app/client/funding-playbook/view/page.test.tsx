import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import StandaloneFundingPlaybookPage, {
  StandaloneFundingPlaybookContent,
} from "@/app/(standalone)/client/funding-playbook/view/page";
import { useAuth } from "@/provider/AuthContext";

vi.mock("@/provider/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/client/funding-playbook/view",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/funding-playbook/FundingPlaybookView", () => ({
  FundingPlaybookView: ({ playbook, selectedFundingPath }: any) => (
    <div data-testid="playbook-view">
      <span>Playbook: {playbook?.meta?.id || "loaded"}</span>
      <span>Pathway: {selectedFundingPath}</span>
    </div>
  ),
}));

describe("StandaloneFundingPlaybookPage (/client/funding-playbook/view)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    (useAuth as any).mockReturnValue({
      user: { uid: "user-123", displayName: "Damani" },
      userData: { firstName: "Damani" },
      loading: false,
    });
  });

  it("renders sign in required message when user is not logged in", async () => {
    (useAuth as any).mockReturnValue({
      user: null,
      userData: null,
      loading: false,
    });

    render(<StandaloneFundingPlaybookContent />);

    expect(screen.getByText("Sign In Required")).toBeDefined();
    expect(
      screen.getByText(
        "Please sign in to view your personalized Funding Playbook.",
      ),
    ).toBeDefined();
  });

  it("renders missing information notice when lenderId or productId is missing", async () => {
    render(<StandaloneFundingPlaybookContent initialLenderId="chase" />);

    expect(screen.getByText("Funding Playbook Unavailable")).toBeDefined();
    expect(
      screen.getByText(
        "Missing lender or product information to load the Funding Playbook.",
      ),
    ).toBeDefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and renders the playbook directly without selectors when parameters are provided via props", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cached: true,
        playbook: {
          meta: { id: "user-123_chase_prod-1" },
          section1_bestMethod: { channel: "online" },
        },
      }),
    });

    render(
      <StandaloneFundingPlaybookContent
        initialLenderId="chase"
        initialProductId="prod-1"
        initialPathwayId="income_based"
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-playbook/fetch?userId=user-123&lenderId=chase&productId=prod-1",
      );
      expect(screen.getByTestId("playbook-view")).toBeDefined();
      expect(screen.getByText("Playbook: user-123_chase_prod-1")).toBeDefined();
      expect(screen.getByText("Pathway: Income-Based Lenders")).toBeDefined();
    });

    // Ensure no select elements or dropdowns are rendered
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("renders error state when fetch returns not found or error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "No cached playbook found." }),
    });

    render(
      <StandaloneFundingPlaybookContent
        initialLenderId="chase"
        initialProductId="prod-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Funding Playbook Unavailable")).toBeDefined();
      expect(screen.getByText("No cached playbook found.")).toBeDefined();
      expect(
        screen.getByRole("link", {
          name: /Go to Funding Playbook Dashboard/i,
        }),
      ).toBeDefined();
    });
  });

  it("renders with custom pathway formatting when pathwayId is formatted differently", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cached: true,
        playbook: {
          meta: { id: "user-123_chase_prod-1" },
          section1_bestMethod: { channel: "online" },
        },
      }),
    });

    render(
      <StandaloneFundingPlaybookContent
        initialLenderId="chase"
        initialProductId="prod-1"
        initialPathwayId="business_loan"
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-playbook/fetch?userId=user-123&lenderId=chase&productId=prod-1",
      );
      expect(screen.getByTestId("playbook-view")).toBeDefined();
      expect(screen.getByText("Pathway: Business Loans")).toBeDefined();
    });
  });

  it("renders wrapper component StandaloneFundingPlaybookPage without crashing", async () => {
    render(<StandaloneFundingPlaybookPage />);

    expect(screen.getByText("Funding Playbook Unavailable")).toBeDefined();
  });
});

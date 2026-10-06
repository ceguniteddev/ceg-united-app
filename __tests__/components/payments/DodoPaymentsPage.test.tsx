/// <reference types="vitest/globals" />

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import DodoPaymentsPage from "@/app/(admin)/admin/payments/dodo/page";

const mockUseGetDodoPayments = vi.fn();

vi.mock("@/hooks/admin/payments/dodo", () => ({
  useGetDodoPayments: () => mockUseGetDodoPayments(),
}));

describe("DodoPaymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner when loading", () => {
    mockUseGetDodoPayments.mockReturnValue({
      dodoPayments: undefined,
      isLoading: true,
      error: null,
    });

    render(<DodoPaymentsPage />);
    expect(screen.getByText("Loading Dodo payments...")).toBeDefined();
  });

  it("renders error alert when fetch fails", () => {
    mockUseGetDodoPayments.mockReturnValue({
      dodoPayments: undefined,
      isLoading: false,
      error: new Error("Failed"),
    });

    render(<DodoPaymentsPage />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Failed to load Dodo payments.",
    );
  });

  it("renders payments with Firestore timestamps formatted properly", () => {
    const timestampSeconds = 1774397024; // 2026-03-24
    const expectedDate = new Date(timestampSeconds * 1000).toLocaleDateString();

    mockUseGetDodoPayments.mockReturnValue({
      dodoPayments: [
        {
          payment_id: "pay_1",
          created_at: { _seconds: timestampSeconds, _nanoseconds: 0 },
          mappedEmail: "user@example.com",
          customer: { email: "customer@example.com" },
          total_amount: 19800,
          status: "succeeded",
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<DodoPaymentsPage />);

    expect(screen.getByText(expectedDate)).toBeDefined();
    expect(screen.queryByText("Invalid Date")).toBeNull();
    expect(screen.getByText("user@example.com")).toBeDefined();
    expect(screen.getByText("$198.00")).toBeDefined();
    expect(screen.getByText("succeeded")).toBeDefined();
  });

  it("renders payments with ISO date strings and fallbacks", () => {
    const isoDate = "2026-09-24T00:03:44.000Z";
    const expectedDate = new Date(isoDate).toLocaleDateString();

    mockUseGetDodoPayments.mockReturnValue({
      dodoPayments: [
        {
          payment_id: "pay_2",
          created_at: isoDate,
          customer: { email: "fallback@example.com" },
          total_amount: 5000,
          status: "succeeded",
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<DodoPaymentsPage />);

    expect(screen.getByText(expectedDate)).toBeDefined();
    expect(screen.queryByText("Invalid Date")).toBeNull();
    expect(screen.getByText("fallback@example.com")).toBeDefined();
    expect(screen.getByText("$50.00")).toBeDefined();
  });
});

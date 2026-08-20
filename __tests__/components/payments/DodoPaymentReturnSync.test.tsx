/// <reference types="vitest/globals" />

import { vi } from "vitest";

vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user-123" },
    userData: { id: "test-user-123" },
  }),
}));

import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { DodoPaymentReturnSync } from "@/components/payments/DodoPaymentReturnSync";

describe("DodoPaymentReturnSync", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "mem-1",
          status: "active",
          tier: "tier_pro",
        }),
    });
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/client/home");
    }
  });

  it("does not invalidate queries when no payment return search parameters are present", () => {
    const infoSpy = vi.spyOn(toast, "info");

    render(
      <QueryClientProvider client={queryClient}>
        <DodoPaymentReturnSync />
      </QueryClientProvider>,
    );

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("invalidates queries and verifies membership when payment_id is present in URL", async () => {
    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        "",
        "/client/home?payment_id=pay_test_123&status=succeeded",
      );
    }

    const infoSpy = vi.spyOn(toast, "info");
    const successSpy = vi.spyOn(toast, "success");

    render(
      <QueryClientProvider client={queryClient}>
        <DodoPaymentReturnSync />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith(
        "Verifying your payment and updating membership status...",
      );
      expect(successSpy).toHaveBeenCalledWith(
        "Membership activated! Welcome to CEG Brain.",
      );
    });
  });

  it("verifies membership from the explicit checkout return marker", async () => {
    window.history.replaceState({}, "", "/client/home?membershipCheckout=1");

    render(
      <QueryClientProvider client={queryClient}>
        <DodoPaymentReturnSync />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/test-user-123/membership?bypassCache=true",
      );
      expect(window.location.search).not.toContain("membershipCheckout");
    });
  });
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BankPlaybookButton } from "@/components/funding/BankPlaybookButton";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("BankPlaybookButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the playbook link when a cached playbook exists for the bank and product", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cached: true,
        playbook: {
          section1_bestMethod: { channel: "online" },
        },
      }),
    });

    render(
      <BankPlaybookButton
        userId="user-123"
        lenderId="chase"
        productId="prod-1"
        referenceNumber="REF-12345"
        pathwayId="income_based"
        fundMappingApprovedId="fund-map-1"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /Playbook/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/client/funding-playbook/view?lenderId=chase&productId=prod-1&pathwayId=income_based&referenceNumber=REF-12345&fundId=fund-map-1",
      );
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });

  it("does not render when no cached playbook exists", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" }),
    });

    render(
      <BankPlaybookButton
        userId="user-123"
        lenderId="chase"
        productId="prod-1"
        referenceNumber="REF-12345"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /Playbook/i })).toBeNull();
    });
  });

  it("does not fetch or render when required parameters are missing", () => {
    render(
      <BankPlaybookButton userId="" lenderId="chase" productId="prod-1" />,
      { wrapper: createWrapper() },
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /Playbook/i })).toBeNull();
  });
});

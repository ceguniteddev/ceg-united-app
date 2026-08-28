import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  function TestQueryClientProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return TestQueryClientProvider;
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
      const link = screen.getByRole("link", { name: /View Playbook/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/client/funding-playbook/view?lenderId=chase&productId=prod-1&pathwayId=income_based&referenceNumber=REF-12345&fundId=fund-map-1",
      );
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });

  it("force-regenerates an existing playbook", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cached: true,
          playbook: { section1_bestMethod: { channel: "online" } },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cached: false,
          playbook: { section1_bestMethod: { channel: "branch" } },
        }),
      });

    render(
      <BankPlaybookButton
        userId="user-123"
        lenderId="chase"
        productId="prod-1"
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Regenerate Funding Playbook",
      }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/funding-playbook/generate?force=true",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("generates a playbook when no cached playbook exists", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          playbook: { section1_bestMethod: { channel: "online" } },
        }),
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

    const generateButton = await screen.findByRole("button", {
      name: "Generate Funding Playbook",
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/funding-playbook/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            userId: "user-123",
            lenderId: "chase",
            productId: "prod-1",
          }),
        }),
      );
      expect(
        screen.getByRole("link", { name: /View Playbook/i }),
      ).toBeDefined();
    });
  });

  it("does not fetch or render when required parameters are missing", () => {
    render(
      <BankPlaybookButton userId="" lenderId="chase" productId="prod-1" />,
      { wrapper: createWrapper() },
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /Playbook/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Generate Funding Playbook/i }),
    ).toBeNull();
  });
});

/// <reference types="vitest/globals" />

import { act, renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "@/__tests__/utils/test-utils";
import { useDodoCheckoutDetails } from "@/hooks/dodo";
import {
  useGetDodoPayments,
  useMapDodoPayment,
  useUnmapDodoPayment,
} from "@/hooks/admin/payments/dodo";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

describe("Dodo hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches checkout details and handles errors", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkoutId: "cks" }),
    });
    const { result } = renderHook(() => useDodoCheckoutDetails("cks"), {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(result.current.checkoutDetails).toEqual({ checkoutId: "cks" }),
    );
    expect(fetch).toHaveBeenCalledWith("/api/dodo/checkout/cks");

    (fetch as any).mockResolvedValueOnce({ ok: false });
    const failed = renderHook(() => useDodoCheckoutDetails("bad"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(failed.result.current.error).toBeTruthy());
  });

  it("does not fetch checkout without an id", () => {
    const { result } = renderHook(() => useDodoCheckoutDetails(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches admin payments and reports errors", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ payment_id: "p" }],
    });
    const success = renderHook(useGetDodoPayments, {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(success.result.current.dodoPayments).toHaveLength(1),
    );

    (fetch as any).mockResolvedValueOnce({ ok: false });
    const failed = renderHook(useGetDodoPayments, { wrapper: createWrapper() });
    await waitFor(() => expect(failed.result.current.error).toBeTruthy());
  });

  it("maps and unmaps payments with success and error notifications", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const map = renderHook(useMapDodoPayment, { wrapper: createWrapper() });
    const unmap = renderHook(useUnmapDodoPayment, { wrapper: createWrapper() });
    await act(() => map.result.current.mapPayment({ docId: "d", userId: "u" }));
    await act(() => unmap.result.current.unmapPayment({ docId: "d" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/payments/dodo/map",
      expect.objectContaining({ method: "POST" }),
    );

    (fetch as any).mockResolvedValue({ ok: false });
    await expect(
      map.result.current.mapPayment({ docId: "x", userId: "u" }),
    ).rejects.toThrow();
    await expect(
      unmap.result.current.unmapPayment({ docId: "x" }),
    ).rejects.toThrow();
    expect(fetch).toHaveBeenCalledWith(
      "/api/payments/dodo/unmap",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

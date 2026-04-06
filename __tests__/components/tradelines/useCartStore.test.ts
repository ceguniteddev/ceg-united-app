import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCartStore } from "@/components/tradelines/useCartStore";
import type { AvailableTradeline } from "@/types/tradelines";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_USER_ID = "user-123";

const makeTradeline = (
  overrides: Partial<AvailableTradeline> = {},
): AvailableTradeline => ({
  id: "tl-1",
  bankName: "Test Bank",
  cardId: "card-1",
  creditLimit: 5000,
  dateOpened: "2024-01-01",
  purchaseByDate: "2025-01-01",
  reportingDate: "2024-06-01",
  stock: 10,
  price: 100,
  status: "in-stock",
  ...overrides,
});

const resetStore = () => {
  useCartStore.setState({
    items: [],
    isLoading: false,
    isInitialized: false,
    userId: null,
  });
};

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  resetStore();
  vi.restoreAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: [] }),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Bug 7: clearCart cancels pending debounced sync ───────────────────────────

describe("Bug 7 — clearCart cancels pending debounced sync", () => {
  it("should cancel a pending debounced sync when clearCart is called", async () => {
    vi.useFakeTimers();

    useCartStore.setState({ userId: TEST_USER_ID });

    // addItem schedules a debounced sync (500ms)
    useCartStore.getState().addItem(makeTradeline());

    // Immediately clear the cart — should cancel the pending sync
    const clearPromise = useCartStore.getState().clearCart();

    // Flush the microtask for the DELETE fetch inside clearCart
    await vi.advanceTimersByTimeAsync(0);
    await clearPromise;

    // Advance past the 500ms debounce window
    await vi.advanceTimersByTimeAsync(600);

    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;

    // Only one fetch should have occurred: the DELETE from clearCart
    // The debounced POST sync should NOT have fired
    const deleteCalls = fetchCalls.filter(
      ([, opts]: [string, RequestInit | undefined]) =>
        opts?.method === "DELETE",
    );
    const postCalls = fetchCalls.filter(
      ([, opts]: [string, RequestInit | undefined]) => opts?.method === "POST",
    );

    expect(deleteCalls).toHaveLength(1);
    expect(postCalls).toHaveLength(0);
  });

  it("should not leave stale items after clearCart even if sync was pending", async () => {
    vi.useFakeTimers();

    useCartStore.setState({ userId: TEST_USER_ID });

    useCartStore.getState().addItem(makeTradeline());
    expect(useCartStore.getState().items).toHaveLength(1);

    await useCartStore.getState().clearCart();
    await vi.advanceTimersByTimeAsync(600);

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

// ── Bug 8: clearCart returns Promise<void> ────────────────────────────────────

describe("Bug 8 — clearCart returns Promise<void>", () => {
  it("should return a promise that can be awaited", async () => {
    useCartStore.setState({ userId: TEST_USER_ID });

    const result = useCartStore.getState().clearCart();

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  it("should return a promise even when userId is not set", async () => {
    const result = useCartStore.getState().clearCart();

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });
});

// ── Bug 13: loadCart sets isInitialized on error ──────────────────────────────

describe("Bug 13 — loadCart sets isInitialized on error", () => {
  it("should set isInitialized to true when fetch rejects", async () => {
    useCartStore.setState({ userId: TEST_USER_ID });

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error"),
    );

    await useCartStore.getState().loadCart();

    const { isInitialized, isLoading } = useCartStore.getState();
    expect(isInitialized).toBe(true);
    expect(isLoading).toBe(false);
  });

  it("should set isInitialized to true when response is not ok", async () => {
    useCartStore.setState({ userId: TEST_USER_ID });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await useCartStore.getState().loadCart();

    const { isInitialized, isLoading } = useCartStore.getState();
    expect(isInitialized).toBe(true);
    expect(isLoading).toBe(false);
  });

  it("should set isInitialized to true on a successful load", async () => {
    useCartStore.setState({ userId: TEST_USER_ID });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ tradeline: makeTradeline(), quantity: 1 }],
      }),
    });

    await useCartStore.getState().loadCart();

    const { isInitialized, isLoading } = useCartStore.getState();
    expect(isInitialized).toBe(true);
    expect(isLoading).toBe(false);
  });
});

// ── clearCart — general behavior ──────────────────────────────────────────────

describe("clearCart — general behavior", () => {
  it("should clear items and call DELETE endpoint", async () => {
    useCartStore.setState({
      userId: TEST_USER_ID,
      items: [{ tradeline: makeTradeline(), quantity: 2 }],
    });

    await useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual([]);
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/user/${TEST_USER_ID}/tradelines/cart`,
      { method: "DELETE" },
    );
  });

  it("should clear items without calling fetch when userId is null", async () => {
    useCartStore.setState({
      userId: null,
      items: [{ tradeline: makeTradeline(), quantity: 1 }],
    });

    await useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

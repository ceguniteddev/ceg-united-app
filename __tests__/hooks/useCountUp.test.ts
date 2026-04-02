import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCountUp } from "@/hooks/useCountUp";

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start at 0", () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(0);
  });

  it("should return 0 immediately when target is 0", () => {
    const { result } = renderHook(() => useCountUp(0, 1000));
    expect(result.current).toBe(0);
  });

  it("should reach the end value after duration", async () => {
    let rafCallbacks: FrameRequestCallback[] = [];
    let rafId = 0;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const { result } = renderHook(() => useCountUp(100, 1000));

    // Simulate enough frames to complete the animation
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      for (const cb of callbacks) {
        act(() => {
          cb(startTime + i * 20);
        });
      }
    }

    expect(result.current).toBe(100);

    vi.restoreAllMocks();
  });

  it("should update count over time", () => {
    let rafCallbacks: FrameRequestCallback[] = [];
    let rafId = 0;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const { result } = renderHook(() => useCountUp(1000, 1200));

    // Simulate a frame at 50% of duration
    const startTime = 0;
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of callbacks) {
      act(() => cb(startTime));
    }

    const midCallbacks = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of midCallbacks) {
      act(() => cb(600));
    }

    // At 50% progress with ease-out-cubic, value should be > 0
    expect(result.current).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });
});

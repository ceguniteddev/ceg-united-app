import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCarousel } from "@/hooks/useCarousel";

describe("useCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start at image index 0", () => {
    const { result } = renderHook(() => useCarousel({ totalImages: 3 }));

    expect(result.current).toBe(0);
  });

  it("should advance to next image after interval", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalImages: 3, interval: 1000 }),
    );

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(1);
  });

  it("should wrap around to 0 after last image", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalImages: 3, interval: 1000 }),
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toBe(0);
  });

  it("should use default interval of 5000ms", () => {
    const { result } = renderHook(() => useCarousel({ totalImages: 2 }));

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(1);
  });

  it("should cycle through all images correctly", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalImages: 4, interval: 1000 }),
    );

    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(3);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
  });
});

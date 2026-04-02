import { describe, it, expect, beforeEach } from "vitest";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { act } from "@testing-library/react";

describe("useConfettiStore", () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useConfettiStore.getState().onClose();
    });
  });

  it("should start with isOpen as false", () => {
    expect(useConfettiStore.getState().isOpen).toBe(false);
  });

  it("should set isOpen to true when onOpen is called", () => {
    act(() => {
      useConfettiStore.getState().onOpen();
    });

    expect(useConfettiStore.getState().isOpen).toBe(true);
  });

  it("should set isOpen to false when onClose is called", () => {
    act(() => {
      useConfettiStore.getState().onOpen();
    });
    expect(useConfettiStore.getState().isOpen).toBe(true);

    act(() => {
      useConfettiStore.getState().onClose();
    });
    expect(useConfettiStore.getState().isOpen).toBe(false);
  });

  it("should toggle between open and close", () => {
    const store = useConfettiStore.getState();

    act(() => store.onOpen());
    expect(useConfettiStore.getState().isOpen).toBe(true);

    act(() => useConfettiStore.getState().onClose());
    expect(useConfettiStore.getState().isOpen).toBe(false);

    act(() => useConfettiStore.getState().onOpen());
    expect(useConfettiStore.getState().isOpen).toBe(true);
  });
});

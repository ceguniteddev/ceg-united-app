import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useContactUsQuery,
  useContactUsQueryIsOpen,
  useContactUsMutation,
} from "@/hooks/contact-us";
import { createWrapper } from "../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/contact-us", () => ({
  getRequestsCustomerCall: vi.fn(),
  getRequestsCustomerCallIsOpen: vi.fn(),
  recordRequestCustomerCall: vi.fn(),
  updateRequestCustomerCall: vi.fn(),
}));

import {
  getRequestsCustomerCall,
  getRequestsCustomerCallIsOpen,
  recordRequestCustomerCall,
  updateRequestCustomerCall,
} from "@/service/contact-us";

describe("contact-us hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useContactUsQuery", () => {
    it("should fetch request calls successfully", async () => {
      const mockData = [{ id: "1", name: "Test Call" }];
      (getRequestsCustomerCall as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useContactUsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.requestCalls).toEqual(mockData);
    });
  });

  describe("useContactUsQueryIsOpen", () => {
    it("should fetch open request calls successfully", async () => {
      const mockData = [{ id: "2", name: "Open Call" }];
      (getRequestsCustomerCallIsOpen as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useContactUsQueryIsOpen(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.requestCallsOpen).toEqual(mockData);
    });
  });

  describe("useContactUsMutation", () => {
    it("should create a request call successfully", async () => {
      (recordRequestCustomerCall as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useContactUsMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.requestCall({ values: { name: "Test" } as any });

      expect(recordRequestCustomerCall).toHaveBeenCalledWith("user-123", {
        name: "Test",
      });
    });

    it("should update a request call successfully", async () => {
      (updateRequestCustomerCall as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useContactUsMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateRequestCall({
        values: { name: "Updated" } as any,
        id: "call-1",
      });

      expect(updateRequestCustomerCall).toHaveBeenCalledWith("call-1", {
        name: "Updated",
      });
    });
  });
});

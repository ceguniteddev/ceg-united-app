import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetBrokerStatistics,
  useGetBrokerClients,
  useGetBrokerPendingInvitations,
  useGetBrokerCommissions,
  useSubmitClientApplication,
  useGetBrokerClientsMappedFunding,
  useGetAllBrokers,
  useUpdateBrokerStatusMutation,
  useInviteClientMutation,
} from "@/hooks/broker";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "broker-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

global.fetch = vi.fn();

describe("broker hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetBrokerStatistics", () => {
    it("should fetch broker statistics", async () => {
      const mockData = { totalClients: 5, totalCommission: 1000 };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetBrokerStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.statistics).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/broker/broker-123/statistics",
      );
    });
  });

  describe("useGetBrokerClients", () => {
    it("should fetch broker clients", async () => {
      const mockData = [{ id: "c1", name: "Client 1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetBrokerClients(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.clients).toEqual(mockData);
    });

    it("should default to empty array on no data", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useGetBrokerClients(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.clients).toEqual([]);
    });
  });

  describe("useGetBrokerPendingInvitations", () => {
    it("should fetch broker invitations", async () => {
      const mockData = [{ id: "i1", email: "test@test.com" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetBrokerPendingInvitations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.invitations).toEqual(mockData);
    });
  });

  describe("useGetBrokerCommissions", () => {
    it("should fetch commissions with status filter", async () => {
      const mockData = [{ id: "c1", amount: 500 }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetBrokerCommissions("Approved"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.commissions).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/broker/broker-123/commissions?status=Approved",
      );
    });

    it("should fetch all commissions without status", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderHook(() => useGetBrokerCommissions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/broker/broker-123/commissions",
        );
      });
    });
  });

  describe("useSubmitClientApplication", () => {
    it("should submit application successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "app-1" }),
      });

      const { result } = renderHook(() => useSubmitClientApplication(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        step1Data: { email: "test@test.com" },
        step2Data: {},
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/broker/broker-123/submit-application",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should handle submit error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: ["Validation failed"] }),
      });

      const { result } = renderHook(() => useSubmitClientApplication(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ step1Data: {}, step2Data: {} });
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("useGetAllBrokers", () => {
    it("should fetch all brokers", async () => {
      const mockData = [{ id: "b1", name: "Broker 1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetAllBrokers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.brokers).toEqual(mockData);
    });
  });

  describe("useUpdateBrokerStatusMutation", () => {
    it("should update broker status", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(
        () => useUpdateBrokerStatusMutation({ brokerId: "b1" }),
        { wrapper: createWrapper() },
      );

      await result.current.updateBrokerStatus({ status: "Active" });

      expect(global.fetch).toHaveBeenCalledWith("/api/broker/b1/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Active" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Broker status updated successfully!",
      );
    });
  });

  describe("useInviteClientMutation", () => {
    it("should invite client successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: "test@test.com" }),
      });

      const { result } = renderHook(() => useInviteClientMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.inviteClient({ email: "test@test.com" });

      expect(global.fetch).toHaveBeenCalledWith("/api/broker/invite-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });
    });
  });
});

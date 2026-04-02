import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useSendClientServiceAgreementMutation,
  useDeleteUserMutation,
  useUsersQuery,
  useUserQuery,
  useUserNotesQuery,
  useUpdateUserOnboardingMutation,
  useUpdateUserStatusMutation,
  useUpdateUserPremiumStatusMutation,
  useUpdateUserProfileMutation,
  useUpdateClientBrokerMutation,
  useToggleLetterFeatureMutation,
  useAddUserNotesMutation,
  useGetUserNoteQuery,
  useUpdateUserNoteMutation,
  useAdminAddClientMutation,
} from "@/hooks/user";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/user", () => ({
  addUserNotes: vi.fn(),
  getUserNotes: vi.fn(),
  updateUserOnboardingStatus: vi.fn(),
}));

import {
  addUserNotes,
  getUserNotes,
  updateUserOnboardingStatus,
} from "@/service/user";

global.fetch = vi.fn();

describe("user hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSendClientServiceAgreementMutation", () => {
    it("should send agreement successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const onSuccess = vi.fn();
      const { result } = renderHook(
        () =>
          useSendClientServiceAgreementMutation({ userId: "u1", onSuccess }),
        { wrapper: createWrapper() },
      );

      await result.current.sendClientServiceAgreement();

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/send-agreement", {
        method: "POST",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Client service agreement sent successfully",
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should handle failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(
        () => useSendClientServiceAgreementMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      try {
        await result.current.sendClientServiceAgreement();
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("useDeleteUserMutation", () => {
    it("should delete user successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const onSuccess = vi.fn();
      const { result } = renderHook(
        () => useDeleteUserMutation({ userId: "u1", onSuccess }),
        { wrapper: createWrapper() },
      );

      await result.current.deleteUser();

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1", {
        method: "DELETE",
      });
      expect(toast.success).toHaveBeenCalledWith("User deleted successfully");
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should handle delete failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(
        () => useDeleteUserMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      try {
        await result.current.deleteUser();
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("useUsersQuery", () => {
    it("should fetch users by role", async () => {
      const mockData = [{ id: "1", name: "User 1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useUsersQuery("Client" as any), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.users).toEqual(mockData);
    });
  });

  describe("useUserQuery", () => {
    it("should fetch user by id", async () => {
      const mockData = { id: "u1", name: "Test User" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useUserQuery("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userData).toEqual(mockData);
    });

    it("should not fetch when id is empty", async () => {
      const { result } = renderHook(() => useUserQuery(""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useUserNotesQuery", () => {
    it("should fetch user notes", async () => {
      const mockNotes = ["note1", "note2"];
      (getUserNotes as any).mockResolvedValueOnce(mockNotes);

      const { result } = renderHook(() => useUserNotesQuery("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notes).toEqual(mockNotes);
    });
  });

  describe("useUpdateUserOnboardingMutation", () => {
    it("should update onboarding status", async () => {
      (updateUserOnboardingStatus as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUpdateUserOnboardingMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateOnboarding();

      expect(updateUserOnboardingStatus).toHaveBeenCalledWith("user-123", true);
    });
  });

  describe("useUpdateUserStatusMutation", () => {
    it("should update user status", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(
        () => useUpdateUserStatusMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await result.current.updateUserStatus({ status: "Active" as any });

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/status", {
        method: "POST",
        body: JSON.stringify({ status: "Active" }),
      });
      expect(toast.success).toHaveBeenCalledWith("User status updated");
    });
  });

  describe("useUpdateUserPremiumStatusMutation", () => {
    it("should update premium status", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(
        () => useUpdateUserPremiumStatusMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await result.current.updatePremiumStatus({ isPremium: true });

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/premium", {
        method: "POST",
        body: JSON.stringify({ isPremium: true }),
      });
      expect(toast.success).toHaveBeenCalledWith("Premium status updated");
    });
  });

  describe("useUpdateUserProfileMutation", () => {
    it("should update user profile", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(
        () => useUpdateUserProfileMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await result.current.updateUserProfile({ firstName: "John" });

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "John" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "User profile updated successfully",
      );
    });
  });

  describe("useUpdateClientBrokerMutation", () => {
    it("should update broker assignment", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(
        () => useUpdateClientBrokerMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await result.current.updateClientBroker({
        brokerId: "b1",
        brokerName: "Broker One",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/broker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerId: "b1", brokerName: "Broker One" }),
      });
    });
  });

  describe("useToggleLetterFeatureMutation", () => {
    it("should toggle letter feature", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(
        () => useToggleLetterFeatureMutation({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await result.current.toggleLetterFeature({
        enabled: true,
        featureKey: "dispute",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/letter-feature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, featureKey: "dispute" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Letter feature enabled successfully",
      );
    });
  });

  describe("useAddUserNotesMutation", () => {
    it("should add user notes", async () => {
      (addUserNotes as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAddUserNotesMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.addUserNotes({
        userId: "u1",
        notes: ["Note 1"],
      });

      expect(addUserNotes).toHaveBeenCalledWith({
        userId: "u1",
        notes: ["Note 1"],
      });
      expect(toast.success).toHaveBeenCalledWith("Notes successfully added.");
    });
  });

  describe("useGetUserNoteQuery", () => {
    it("should fetch user note", async () => {
      const mockNote = {
        comments: [{ text: "Hello", createdAt: "2026-01-01T00:00:00Z" }],
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNote,
      });

      const { result } = renderHook(() => useGetUserNoteQuery("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/notes");
    });

    it("should not fetch when userId is empty", async () => {
      const { result } = renderHook(() => useGetUserNoteQuery(""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useUpdateUserNoteMutation", () => {
    it("should update user note", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useUpdateUserNoteMutation("u1"), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ comments: [] } as any);

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: [] }),
      });
      expect(toast.success).toHaveBeenCalledWith("Note saved successfully!");
    });
  });

  describe("useAdminAddClientMutation", () => {
    it("should add a client successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-client" }),
      });

      const { result } = renderHook(() => useAdminAddClientMutation(), {
        wrapper: createWrapper(),
      });

      const res = await result.current.mutateAsync({
        step1Data: { email: "test@test.com" },
        step2Data: { name: "Test" },
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/clients/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step1Data: { email: "test@test.com" },
          step2Data: { name: "Test" },
        }),
      });
    });

    it("should handle error when adding client fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: "Email already exists" }),
      });

      const { result } = renderHook(() => useAdminAddClientMutation(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({
          step1Data: {},
          step2Data: {},
        });
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetUserApplyFunding,
  useGetClientApplyFunding,
  useGetFundingApplications,
  useGetApplyFundingByReferenceNumber,
  useGetFundingApplicationsIsNew,
  useApplyFunding,
  useAddFundApplicationNotesMutation,
  useAddFundApplicationNotesQuery,
  useGetNoteQuery,
  useUpdateNoteMutation,
} from "@/hooks/apply-funding";
import { createWrapper } from "../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFunding: vi.fn(),
  getApplyFundingByReferenceNumber: vi.fn(),
  getFundingApplications: vi.fn(),
  applyFunding: vi.fn(),
  updateApplyFunding: vi.fn(),
  deleteApplyFunding: vi.fn(),
  addFundApplicationNotes: vi.fn(),
  getFundApplicationNotes: vi.fn(),
}));

import {
  getApplyFunding,
  getApplyFundingByReferenceNumber,
  getFundingApplications,
  applyFunding,
  updateApplyFunding,
  addFundApplicationNotes,
  getFundApplicationNotes,
} from "@/service/apply-funding";
import { toast } from "sonner";

global.fetch = vi.fn();

describe("apply-funding hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetUserApplyFunding", () => {
    it("should fetch user funding applications", async () => {
      const mockData = [{ id: "1", referenceNumber: "REF-001" }];
      (getApplyFunding as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useGetUserApplyFunding(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appliedFunding).toEqual(mockData);
      expect(getApplyFunding).toHaveBeenCalledWith("user-123");
    });
  });

  describe("useGetClientApplyFunding", () => {
    it("should fetch client funding applications by userId", async () => {
      const mockData = [{ id: "2", referenceNumber: "REF-002" }];
      (getApplyFunding as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useGetClientApplyFunding("client-1"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appliedFunding).toEqual(mockData);
      expect(getApplyFunding).toHaveBeenCalledWith("client-1");
    });

    it("should not fetch when userId is empty", async () => {
      const { result } = renderHook(() => useGetClientApplyFunding(""), {
        wrapper: createWrapper(),
      });

      expect(getApplyFunding).not.toHaveBeenCalled();
    });
  });

  describe("useGetFundingApplications", () => {
    it("should fetch funding applications with state filter", async () => {
      const mockData = [{ id: "3" }];
      (getFundingApplications as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useGetFundingApplications({ state: "CA" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appliedFunding).toEqual(mockData);
      expect(getFundingApplications).toHaveBeenCalledWith({ state: "CA" });
    });
  });

  describe("useGetApplyFundingByReferenceNumber", () => {
    it("should fetch by reference number", async () => {
      const mockData = { id: "4", referenceNumber: "REF-004" };
      (getApplyFundingByReferenceNumber as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () =>
          useGetApplyFundingByReferenceNumber({ referenceNumber: "REF-004" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appliedFunding).toEqual(mockData);
    });

    it("should not fetch when referenceNumber is empty", async () => {
      renderHook(
        () => useGetApplyFundingByReferenceNumber({ referenceNumber: "" }),
        { wrapper: createWrapper() },
      );

      expect(getApplyFundingByReferenceNumber).not.toHaveBeenCalled();
    });
  });

  describe("useGetFundingApplicationsIsNew", () => {
    it("should fetch new funding applications", async () => {
      const mockData = [{ id: "5", status: "New" }];
      (getFundingApplications as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useGetFundingApplicationsIsNew(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appliedFunding).toEqual(mockData);
      expect(getFundingApplications).toHaveBeenCalledWith({ status: "New" });
    });
  });

  describe("useApplyFunding", () => {
    it("should apply funding successfully", async () => {
      (applyFunding as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useApplyFunding(), {
        wrapper: createWrapper(),
      });

      await result.current.applyFunding({
        values: { referenceNumber: "REF-001" } as any,
      });

      expect(applyFunding).toHaveBeenCalledWith({
        value: { referenceNumber: "REF-001" },
      });
    });

    it("should update funding successfully", async () => {
      (updateApplyFunding as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useApplyFunding(), {
        wrapper: createWrapper(),
      });

      await result.current.updateApplyFunding({
        values: { referenceNumber: "REF-001" } as any,
      });

      expect(updateApplyFunding).toHaveBeenCalledWith({
        value: { referenceNumber: "REF-001" },
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Application updated successfully.",
      );
    });
  });

  describe("useAddFundApplicationNotesMutation", () => {
    it("should add notes successfully", async () => {
      (addFundApplicationNotes as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(
        () => useAddFundApplicationNotesMutation(),
        { wrapper: createWrapper() },
      );

      await result.current.addNotes({
        referenceNumber: "REF-001",
        notes: ["Note 1"],
      });

      expect(addFundApplicationNotes).toHaveBeenCalledWith({
        referenceNumber: "REF-001",
        notes: ["Note 1"],
      });
      expect(toast.success).toHaveBeenCalledWith("Notes successfully added.");
    });
  });

  describe("useAddFundApplicationNotesQuery", () => {
    it("should fetch fund application notes", async () => {
      const mockNotes = ["note-1", "note-2"];
      (getFundApplicationNotes as any).mockResolvedValueOnce(mockNotes);

      const { result } = renderHook(
        () => useAddFundApplicationNotesQuery({ referenceNumber: "REF-001" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notes).toEqual(mockNotes);
    });
  });

  describe("useGetNoteQuery", () => {
    it("should fetch note by reference number", async () => {
      const mockNote = { comments: [] };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNote,
      });

      const { result } = renderHook(() => useGetNoteQuery("REF-001"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockNote);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-application/REF-001/notes",
      );
    });
  });

  describe("useUpdateNoteMutation", () => {
    it("should update note successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useUpdateNoteMutation("REF-001"), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ comments: [] } as any);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-application/REF-001/notes",
        expect.objectContaining({ method: "POST" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Note saved successfully!");
    });
  });
});

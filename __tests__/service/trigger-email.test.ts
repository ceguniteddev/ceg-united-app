import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock objects BEFORE vi.mock calls
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockAdd = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

const mockDocRef = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};

const mockCollectionRef = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("@/constant/collection-name", () => ({
  MAIL_COLLECTION: "mail",
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((data) => data),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
    delete: vi.fn().mockReturnValue("DELETE_SENTINEL"),
  },
  Timestamp: {
    now: vi.fn().mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }),
  },
}));

vi.mock("@/schema/trigger-email", () => ({}));

import {
  sendTriggerEmail,
  getTriggerEmailStatus,
  getTriggerEmails,
  retryTriggerEmail,
} from "@/service/trigger-email";

describe("service/trigger-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("sendTriggerEmail", () => {
    it("adds email document with from default and serverTimestamp, returns doc id", async () => {
      mockAdd.mockResolvedValueOnce({ id: "email-id-1" });

      const emailData = {
        to: "user@example.com",
        message: { subject: "Hello", text: "World" },
      };
      const result = await sendTriggerEmail(emailData as any);

      expect(mockDb.collection).toHaveBeenCalledWith("mail");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          from: "CEG United LLC <noreply@cegunited.com>",
          createdAt: "SERVER_TIMESTAMP",
        }),
      );
      expect(result).toBe("email-id-1");
    });

    it("uses provided from address when specified", async () => {
      mockAdd.mockResolvedValueOnce({ id: "email-id-2" });

      const emailData = {
        to: "user@example.com",
        from: "custom@cegunited.com",
        message: { subject: "Custom", text: "From" },
      };
      await sendTriggerEmail(emailData as any);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ from: "custom@cegunited.com" }),
      );
    });
  });

  describe("getTriggerEmailStatus", () => {
    it("returns delivery status when email exists", async () => {
      const deliveryStatus = {
        state: "SUCCESS",
        endTime: "2025-01-01T00:00:00Z",
      };
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ delivery: deliveryStatus }),
      });

      const result = await getTriggerEmailStatus("email-id-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("email-id-1");
      expect(result).toEqual(deliveryStatus);
    });

    it("returns null when delivery field is not set yet", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({}),
      });

      const result = await getTriggerEmailStatus("email-id-1");

      expect(result).toBeNull();
    });

    it("throws an error when email document does not exist", async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      await expect(getTriggerEmailStatus("nonexistent")).rejects.toThrow(
        "Email document not found",
      );
    });
  });

  describe("getTriggerEmails", () => {
    it("returns emails ordered by createdAt desc with default limit 100", async () => {
      const docs = [
        {
          id: "e1",
          data: () => ({ to: "a@example.com", createdAt: "2025-01-02" }),
        },
        {
          id: "e2",
          data: () => ({ to: "b@example.com", createdAt: "2025-01-01" }),
        },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getTriggerEmails();

      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "e1", to: "a@example.com" });
    });

    it("uses provided limit parameter", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      await getTriggerEmails(10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it("returns empty array when no emails exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getTriggerEmails();

      expect(result).toEqual([]);
    });
  });

  describe("retryTriggerEmail", () => {
    it("updates delivery state to RETRY when email exists", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ to: "user@example.com" }),
      });
      mockUpdate.mockResolvedValueOnce(undefined);

      const result = await retryTriggerEmail("email-id-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("email-id-1");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "delivery.state": "RETRY",
          "delivery.error": "DELETE_SENTINEL",
          "delivery.endTime": "DELETE_SENTINEL",
        }),
      );
      expect(result).toBe("email-id-1");
    });

    it("throws an error when email document does not exist", async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      await expect(retryTriggerEmail("nonexistent")).rejects.toThrow(
        "Email not found",
      );
    });
  });
});

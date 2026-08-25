/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockAdd = vi.fn();
  const mockOrderBy = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockRunTransaction = vi.fn();

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

  return {
    mockGet,
    mockSet,
    mockUpdate,
    mockDelete,
    mockAdd,
    mockOrderBy,
    mockWhere,
    mockLimit,
    mockRunTransaction,
    mockDocRef,
    mockCollectionRef,
    getCourseById: vi.fn(),
    getUserRecordByEmail: vi.fn(),
  };
});

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection: vi.fn().mockReturnValue(mocks.mockCollectionRef),
    runTransaction: mocks.mockRunTransaction,
  }),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/service/educational-materials/course", () => ({
  getCourseById: mocks.getCourseById,
}));

vi.mock("@/service/user", () => ({
  getUserRecordByEmail: mocks.getUserRecordByEmail,
}));

import {
  validateLuminoWebhookAuth,
  findClientByEmail,
  processLuminoZapierWebhook,
} from "@/service/lumino";

describe("service/lumino", () => {
  const originalSecret = process.env.LUMINO_ZAPIER_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LUMINO_ZAPIER_WEBHOOK_SECRET = "test_lumino_secret_12345";
  });

  afterAll(() => {
    process.env.LUMINO_ZAPIER_WEBHOOK_SECRET = originalSecret;
  });

  describe("validateLuminoWebhookAuth", () => {
    it("returns false if secret is not set in environment", async () => {
      delete process.env.LUMINO_ZAPIER_WEBHOOK_SECRET;
      const isValid = await validateLuminoWebhookAuth("Bearer token123");
      expect(isValid).toBe(false);
    });

    it("returns false if Authorization header is missing or not Bearer", async () => {
      expect(await validateLuminoWebhookAuth(null)).toBe(false);
      expect(await validateLuminoWebhookAuth("Basic abc")).toBe(false);
      expect(await validateLuminoWebhookAuth("Bearer ")).toBe(false);
    });

    it("returns false if token does not match secret", async () => {
      expect(await validateLuminoWebhookAuth("Bearer wrong_secret")).toBe(
        false,
      );
    });

    it("returns true when Bearer token matches secret", async () => {
      expect(
        await validateLuminoWebhookAuth("Bearer test_lumino_secret_12345"),
      ).toBe(true);
    });
  });

  describe("findClientByEmail", () => {
    it("finds user in Firestore user collection by normalized email", async () => {
      const userData = { email: "client@example.com", firstName: "Alice" };
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => userData,
          },
        ],
      });

      const result = await findClientByEmail("  CLIENT@example.com ");
      expect(result).toEqual({ id: "user-123", ...userData });
    });

    it("falls back to Firebase Auth lookup if not found in first query", async () => {
      // 1. Firestore query returns empty
      mocks.mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
      // 2. Auth lookup returns auth user
      mocks.getUserRecordByEmail.mockResolvedValueOnce({
        uid: "auth-uid-456",
        email: "client@example.com",
      });
      // 3. User doc lookup returns user
      mocks.mockGet.mockResolvedValueOnce({
        exists: true,
        id: "auth-uid-456",
        data: () => ({ email: "client@example.com", firstName: "Bob" }),
      });

      const result = await findClientByEmail("client@example.com");
      expect(result).toEqual({
        id: "auth-uid-456",
        email: "client@example.com",
        firstName: "Bob",
      });
    });

    it("returns null if user cannot be found in Firestore or Auth", async () => {
      mocks.mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
      mocks.getUserRecordByEmail.mockResolvedValueOnce(null);

      const result = await findClientByEmail("unknown@example.com");
      expect(result).toBeNull();
    });
  });

  describe("processLuminoZapierWebhook", () => {
    const validPayload = {
      courseId: "course-123",
      customerEmail: "luxmiamidrive@gmail.com",
      customerName: "Apple Pay PlaceHolder",
      paymentAmount: "$1,139.84",
      paymentCreatedAt: "2026-08-07T20:07:09.870Z",
      paymentCurrency: "USD",
      paymentId: "4277a5b8-4f7f-4be5-a13e-7820e504867e",
      paymentMethod: "visa_applepay",
      paymentStatus: "Succeeded",
    };

    it("ignores payment with status other than Succeeded without enrolling", async () => {
      const nonSucceededPayload = {
        ...validPayload,
        paymentStatus: "Pending",
      };

      const result = await processLuminoZapierWebhook(nonSucceededPayload);

      expect(result.success).toBe(true);
      expect(result.enrolled).toBe(false);
      expect(result.status).toBe("Pending");
      expect(mocks.mockRunTransaction).not.toHaveBeenCalled();
    });

    it("throws 404 error when client email cannot be found", async () => {
      // Firestore lookup empty, Auth lookup null
      mocks.mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
      mocks.getUserRecordByEmail.mockResolvedValueOnce(null);

      await expect(processLuminoZapierWebhook(validPayload)).rejects.toThrow(
        "Client not found for email",
      );
    });

    it("throws 404 error when course cannot be found", async () => {
      // User found
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => ({ email: validPayload.customerEmail }),
          },
        ],
      });
      // Course lookup null
      mocks.getCourseById.mockResolvedValueOnce(null);

      await expect(processLuminoZapierWebhook(validPayload)).rejects.toThrow(
        "Course not found for courseId",
      );
    });

    it("throws 422 error when course is not published", async () => {
      // User found
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => ({ email: validPayload.customerEmail }),
          },
        ],
      });
      // Course unpublished
      mocks.getCourseById.mockResolvedValueOnce({
        id: "course-123",
        title: "Draft Course",
        isPublished: false,
      });

      await expect(processLuminoZapierWebhook(validPayload)).rejects.toThrow(
        "is not published",
      );
    });

    it("processes payment and enrolls user atomically", async () => {
      // User found
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => ({ email: validPayload.customerEmail }),
          },
        ],
      });
      // Course published
      mocks.getCourseById.mockResolvedValueOnce({
        id: "course-123",
        title: "Credit Masterclass",
        isPublished: true,
      });

      mocks.mockRunTransaction.mockImplementation(async (cb: any) => {
        const tx = {
          get: vi
            .fn()
            .mockResolvedValueOnce({ exists: false }) // payment check (not duplicate)
            .mockResolvedValueOnce({ empty: true, docs: [] }) // enrollment check (not enrolled)
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({ enrolledStudentsCount: 10 }),
            }), // course doc get
          set: vi.fn(),
          update: vi.fn(),
        };
        await cb(tx);
        expect(tx.set).toHaveBeenCalledTimes(2); // 1 for payment, 1 for enrollment
        expect(tx.update).toHaveBeenCalled(); // 1 for student count increment
      });

      const result = await processLuminoZapierWebhook(validPayload);

      expect(result).toEqual({
        success: true,
        duplicate: false,
        enrolled: true,
        userId: "user-123",
        courseId: "course-123",
        enrolledCourseIds: ["course-123"],
        paymentId: validPayload.paymentId,
        status: "succeeded",
        message: expect.stringContaining("enrolled"),
      });
    });

    it("handles duplicate delivery gracefully without re-enrolling or failing", async () => {
      // User found
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => ({ email: validPayload.customerEmail }),
          },
        ],
      });
      // Course published
      mocks.getCourseById.mockResolvedValueOnce({
        id: "course-123",
        title: "Credit Masterclass",
        isPublished: true,
      });

      mocks.mockRunTransaction.mockImplementation(async (cb: any) => {
        const tx = {
          get: vi.fn().mockResolvedValueOnce({ exists: true }), // payment already exists!
          set: vi.fn(),
          update: vi.fn(),
        };
        await cb(tx);
        expect(tx.set).not.toHaveBeenCalled();
      });

      const result = await processLuminoZapierWebhook(validPayload);

      expect(result).toEqual({
        success: true,
        duplicate: true,
        enrolled: false,
        userId: "user-123",
        courseId: "course-123",
        enrolledCourseIds: ["course-123"],
        paymentId: validPayload.paymentId,
        status: "duplicate",
        message: expect.stringContaining("already processed"),
      });
    });

    it("matches and resolves specific course by paid amount against course price", async () => {
      const payloadWithAmount = {
        customerEmail: "luxmiamidrive@gmail.com",
        customerName: "Apple Pay PlaceHolder",
        paymentAmount: "$1,139.84",
        paymentCreatedAt: "2026-08-07T20:07:09.870Z",
        paymentCurrency: "USD",
        paymentId: "pay_match_amount_123",
        paymentMethod: "visa_applepay",
        paymentStatus: "Succeeded",
      };

      // User found
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => ({ email: payloadWithAmount.customerEmail }),
          },
        ],
      });
      // Published courses query: course A ($499), course B ($1,139.84)
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "course-cheap",
            data: () => ({
              title: "Intro Course",
              price: 499.0,
              isPublished: true,
            }),
          },
          {
            id: "course-premium",
            data: () => ({
              title: "Executive Masterclass",
              price: 1139.84,
              isPublished: true,
            }),
          },
        ],
      });

      mocks.mockRunTransaction.mockImplementation(async (cb: any) => {
        const tx = {
          get: vi
            .fn()
            .mockResolvedValueOnce({ exists: false }) // payment check
            .mockResolvedValueOnce({ empty: true, docs: [] }) // enrollment check
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({ enrolledStudentsCount: 5 }),
            }), // course doc get
          set: vi.fn(),
          update: vi.fn(),
        };
        await cb(tx);
        expect(tx.set).toHaveBeenCalledTimes(2);
      });

      const result = await processLuminoZapierWebhook(payloadWithAmount);

      expect(result.success).toBe(true);
      expect(result.enrolled).toBe(true);
      expect(result.enrolledCourseIds).toEqual(["course-premium"]);
      expect(result.courseId).toBe("course-premium");
    });

    it("throws 404 error when paid amount does not match any published course price", async () => {
      const payloadUnmatchedAmount = {
        customerEmail: "luxmiamidrive@gmail.com",
        customerName: "Apple Pay PlaceHolder",
        paymentAmount: "$999.99",
        paymentCreatedAt: "2026-08-07T20:07:09.870Z",
        paymentCurrency: "USD",
        paymentId: "pay_unmatched_123",
        paymentMethod: "visa_applepay",
        paymentStatus: "Succeeded",
      };

      // User found
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "user-123",
            data: () => ({ email: payloadUnmatchedAmount.customerEmail }),
          },
        ],
      });
      // Published courses query
      mocks.mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "course-1",
            data: () => ({
              title: "Intro Course",
              price: 499.0,
              isPublished: true,
            }),
          },
        ],
      });

      await expect(
        processLuminoZapierWebhook(payloadUnmatchedAmount),
      ).rejects.toThrow(
        "No published course found matching the paid amount of $999.99",
      );
    });
  });
});

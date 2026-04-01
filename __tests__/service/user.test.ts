import { describe, it, expect, vi, beforeEach } from "vitest";

// user.ts calls firestoreAdmin/authenticationAdmin/storageAdmin inside functions
// (not at module level). We still use vi.hoisted() so mock variables are
// available in both the vi.mock() factory and the test bodies.
const {
  mockGet,
  mockSet,
  mockUpdate,
  mockDelete,
  mockAdd,
  mockWhere,
  mockOrderBy,
  mockLimit,
  mockDocFn,
  mockDocRef,
  mockCollectionRef,
  mockBatch,
  mockDb,
  mockAuthAdmin,
  mockBucket,
} = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockAdd = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockDocFn = vi.fn();

  const mockCollectionRef: any = {
    add: mockAdd,
    doc: mockDocFn,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    get: mockGet,
  };

  const mockDocRef: any = {
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
    collection: vi.fn().mockReturnValue(mockCollectionRef),
  };

  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockDocFn.mockReturnValue(mockDocRef);

  const mockBatch = {
    delete: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  const mockDb: any = {
    collection: vi.fn().mockReturnValue(mockCollectionRef),
    collectionGroup: vi.fn().mockReturnValue(mockCollectionRef),
    batch: vi.fn().mockReturnValue(mockBatch),
  };

  const mockAuthAdmin = {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    deleteUser: vi.fn(),
    updateUser: vi.fn(),
    verifyIdToken: vi.fn(),
    verifySessionCookie: vi.fn(),
    createSessionCookie: vi.fn(),
  };

  const mockBucket = {
    getFiles: vi.fn(),
    deleteFiles: vi.fn(),
    file: vi.fn(),
  };

  return {
    mockGet,
    mockSet,
    mockUpdate,
    mockDelete,
    mockAdd,
    mockWhere,
    mockOrderBy,
    mockLimit,
    mockDocFn,
    mockDocRef,
    mockCollectionRef,
    mockBatch,
    mockDb,
    mockAuthAdmin,
    mockBucket,
  };
});

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(() => mockAuthAdmin),
  storageAdmin: vi.fn(() => mockBucket),
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
  normalizeDate: vi.fn((x: any) => x),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("@/service/trigger-email", () => ({
  sendTriggerEmail: vi.fn(),
}));

vi.mock("@/service/email-verification", () => ({
  generateEmailVerificationToken: vi.fn().mockResolvedValue("mock-token"),
}));

vi.mock("@/service/apply-funding", () => ({
  applyFunding: vi.fn().mockResolvedValue({ referenceNumber: "REF-001" }),
}));

vi.mock("@/service/business", () => ({
  recordBusiness: vi.fn().mockResolvedValue("biz-001"),
}));

vi.mock("@/service/crs", () => ({
  sendClientFundingApplicationAuditAnalysis: vi.fn(),
  sendClientFundingApplicationCongratsMessage: vi.fn(),
}));

vi.mock("@/lib/n8n", () => ({
  createAsanaTaskForLender: vi.fn().mockResolvedValue("webhook-id"),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn() }),
  headers: vi.fn().mockResolvedValue({ get: vi.fn() }),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldPath: { documentId: vi.fn(() => "__id__") },
  Timestamp: { now: vi.fn(() => "ts") },
}));

vi.mock("date-fns", () => ({
  format: vi.fn(() => "Jan 1, 2024"),
}));

vi.mock("node:crypto", () => ({
  randomBytes: vi.fn(() => ({ toString: () => "random-hex" })),
}));

import {
  getUserRecordByEmail,
  getUserById,
  getUsers,
  updateUserStatus,
  updateUserPremiumStatus,
  updateUserProfile,
  deleteUser,
  getUserNote,
  updateUserNote,
} from "@/service/user";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetChain() {
  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockDocFn.mockReturnValue(mockDocRef);
  mockDocRef.collection.mockReturnValue(mockCollectionRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
  mockDb.batch.mockReturnValue(mockBatch);
  mockBatch.commit.mockResolvedValue(undefined);
}

const makeSnapshot = (docs: any[]) => ({
  empty: docs.length === 0,
  docs,
  size: docs.length,
  forEach: (cb: Function) => docs.forEach(cb),
});

const makeDocSnap = (exists: boolean, id: string, data: object) => ({
  exists,
  id,
  data: () => data,
});

// ---------------------------------------------------------------------------
// getUserRecordByEmail
// ---------------------------------------------------------------------------

describe("getUserRecordByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns the user record when found in Firebase Auth", async () => {
    const record = { uid: "u1", email: "user@test.com" };
    mockAuthAdmin.getUserByEmail.mockResolvedValueOnce(record);

    const result = await getUserRecordByEmail("user@test.com");

    expect(result).toEqual(record);
    expect(mockAuthAdmin.getUserByEmail).toHaveBeenCalledWith("user@test.com");
  });

  it("returns null when Firebase Auth throws (user not found)", async () => {
    mockAuthAdmin.getUserByEmail.mockRejectedValueOnce(
      new Error("auth/user-not-found"),
    );

    const result = await getUserRecordByEmail("ghost@test.com");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------

describe("getUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns null when the document does not exist", async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap(false, "", {}));

    const result = await getUserById("nonexistent");

    expect(result).toBeNull();
  });

  it("returns user data for a non-Client role (no broker lookup)", async () => {
    mockGet.mockResolvedValueOnce(
      makeDocSnap(true, "u1", {
        role: "Admin",
        firstName: "John",
        email: "john@test.com",
      }),
    );

    const result = await getUserById("u1");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("u1");
    expect(result?.role).toBe("Admin");
  });

  it("returns Client user with empty brokerName when no active broker mapping exists", async () => {
    mockGet
      .mockResolvedValueOnce(
        makeDocSnap(true, "c1", {
          role: "Client",
          firstName: "Alice",
          email: "alice@test.com",
        }),
      )
      .mockResolvedValueOnce(makeSnapshot([])); // empty broker mapping snapshot

    const result = await getUserById("c1");

    expect(result).not.toBeNull();
    expect(result?.role).toBe("Client");
    expect(result?.brokerName).toBe("");
  });

  it("returns Client user with brokerName populated when active broker mapping exists", async () => {
    const mappingDoc = {
      id: "map1",
      data: () => ({ brokerId: "b1", clientId: "c1", status: "Active" }),
    };
    const brokerDocSnap = makeDocSnap(true, "b1", {
      firstName: "Bob",
      lastName: "Smith",
      role: "Broker",
    });

    mockGet
      .mockResolvedValueOnce(
        makeDocSnap(true, "c1", { role: "Client", firstName: "Alice" }),
      )
      .mockResolvedValueOnce(makeSnapshot([mappingDoc])) // broker mapping collection query
      .mockResolvedValueOnce(brokerDocSnap); // broker doc fetch

    const result = await getUserById("c1");

    expect(result?.brokerName).toBe("Bob Smith");
    expect(result?.brokerId).toBe("b1");
  });
});

// ---------------------------------------------------------------------------
// getUsers
// ---------------------------------------------------------------------------

describe("getUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns empty array when no users are found", async () => {
    mockGet.mockResolvedValueOnce(makeSnapshot([]));

    const result = await getUsers();

    expect(result).toEqual([]);
  });

  it("returns all users for a given role filter", async () => {
    const docs = [
      {
        id: "u1",
        data: () => ({
          role: "Admin",
          firstName: "Alice",
          email: "alice@test.com",
        }),
      },
      {
        id: "u2",
        data: () => ({
          role: "Admin",
          firstName: "Bob",
          email: "bob@test.com",
        }),
      },
    ];
    mockGet.mockResolvedValueOnce(makeSnapshot(docs));

    const result = await getUsers("Admin");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("u1");
    expect(result[1].id).toBe("u2");
  });

  it("returns Client users with empty brokerName when no broker mappings exist", async () => {
    const docs = [
      {
        id: "c1",
        data: () => ({
          role: "Client",
          firstName: "Carol",
          email: "carol@test.com",
        }),
      },
    ];
    mockGet
      .mockResolvedValueOnce(makeSnapshot(docs)) // main user query
      .mockResolvedValueOnce(makeSnapshot([])); // broker mappings batch query (empty)

    const result = await getUsers("Client");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
    expect(result[0].brokerName).toBe("");
  });
});

// ---------------------------------------------------------------------------
// updateUserStatus
// ---------------------------------------------------------------------------

describe("updateUserStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("throws AppError when id is missing", async () => {
    await expect(
      updateUserStatus({ id: "", status: "Active" }),
    ).rejects.toThrow("User ID is required.");
  });

  it("throws AppError when status is missing", async () => {
    await expect(
      updateUserStatus({ id: "u1", status: "" as any }),
    ).rejects.toThrow("Status is required.");
  });

  it("throws AppError when user is not found", async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap(false, "", {}));

    await expect(
      updateUserStatus({ id: "u1", status: "Active" }),
    ).rejects.toThrow("User not found.");
  });

  it("updates the activeStatus field when user exists", async () => {
    mockGet.mockResolvedValueOnce(
      makeDocSnap(true, "u1", { role: "Admin", firstName: "John" }),
    );
    mockUpdate.mockResolvedValueOnce(undefined);

    await updateUserStatus({ id: "u1", status: "Inactive" });

    expect(mockUpdate).toHaveBeenCalledWith({ activeStatus: "Inactive" });
  });
});

// ---------------------------------------------------------------------------
// updateUserPremiumStatus
// ---------------------------------------------------------------------------

describe("updateUserPremiumStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("throws AppError when id is missing", async () => {
    await expect(
      updateUserPremiumStatus({ id: "", isPremium: true }),
    ).rejects.toThrow("User ID is required.");
  });

  it("throws AppError when user is not found", async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap(false, "", {}));

    await expect(
      updateUserPremiumStatus({ id: "u1", isPremium: true }),
    ).rejects.toThrow("User not found.");
  });

  it("updates isPremiumClient field on success", async () => {
    // getUserById for an Admin user: one mockGet call
    mockGet.mockResolvedValueOnce(
      makeDocSnap(true, "u1", { role: "Admin", firstName: "Alice" }),
    );
    mockUpdate.mockResolvedValueOnce(undefined);

    await updateUserPremiumStatus({ id: "u1", isPremium: true });

    expect(mockUpdate).toHaveBeenCalledWith({ isPremiumClient: true });
  });

  it("sets isPremiumClient to false when disabling premium", async () => {
    mockGet.mockResolvedValueOnce(
      makeDocSnap(true, "u1", { role: "Admin", firstName: "Alice" }),
    );
    mockUpdate.mockResolvedValueOnce(undefined);

    await updateUserPremiumStatus({ id: "u1", isPremium: false });

    expect(mockUpdate).toHaveBeenCalledWith({ isPremiumClient: false });
  });
});

// ---------------------------------------------------------------------------
// updateUserProfile
// ---------------------------------------------------------------------------

describe("updateUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("throws AppError when userId is missing", async () => {
    await expect(updateUserProfile({ userId: "", data: {} })).rejects.toThrow(
      "User ID is required.",
    );
  });

  it("throws AppError when user is not found", async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap(false, "", {}));

    await expect(
      updateUserProfile({ userId: "u1", data: { firstName: "New" } }),
    ).rejects.toThrow("User not found.");
  });

  it("calls update with profile fields excluding password, email, and role", async () => {
    mockGet.mockResolvedValueOnce(
      makeDocSnap(true, "u1", { role: "Admin", firstName: "Old" }),
    );
    mockUpdate.mockResolvedValueOnce(undefined);

    await updateUserProfile({
      userId: "u1",
      data: {
        firstName: "New",
        email: "should@be.stripped",
        role: "Client" as any,
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith({ firstName: "New" });
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ email: expect.anything() }),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockBatch.commit.mockResolvedValue(undefined);
  });

  it("deletes user from Firestore and Firebase Auth on success", async () => {
    mockGet
      .mockResolvedValueOnce(makeSnapshot([])) // funding applications query (empty)
      .mockResolvedValueOnce(makeSnapshot([])); // broker-client mappings query (empty)
    mockBucket.deleteFiles.mockResolvedValueOnce(undefined);
    mockDelete.mockResolvedValueOnce(undefined);
    mockAuthAdmin.deleteUser.mockResolvedValueOnce(undefined);

    const result = await deleteUser("u1");

    expect(result.message).toContain("deleted successfully");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockAuthAdmin.deleteUser).toHaveBeenCalledWith("u1");
  });

  it("still returns success if Firebase Auth deletion fails (inner try-catch)", async () => {
    mockGet
      .mockResolvedValueOnce(makeSnapshot([]))
      .mockResolvedValueOnce(makeSnapshot([]));
    mockBucket.deleteFiles.mockResolvedValueOnce(undefined);
    mockDelete.mockResolvedValueOnce(undefined);
    mockAuthAdmin.deleteUser.mockRejectedValueOnce(
      new Error("auth/user-not-found"),
    );

    const result = await deleteUser("u1");

    expect(result.message).toContain("deleted successfully");
  });

  it("deletes funding applications using a batch when they exist", async () => {
    const fundingDoc = { id: "fa1", ref: { delete: vi.fn() } };
    mockGet
      .mockResolvedValueOnce(makeSnapshot([fundingDoc])) // funding apps (non-empty)
      .mockResolvedValueOnce(makeSnapshot([])); // broker mappings (empty)
    mockBucket.deleteFiles.mockResolvedValueOnce(undefined);
    mockDelete.mockResolvedValueOnce(undefined);
    mockAuthAdmin.deleteUser.mockResolvedValueOnce(undefined);

    await deleteUser("u1");

    expect(mockBatch.delete).toHaveBeenCalledWith(fundingDoc.ref);
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getUserNote
// ---------------------------------------------------------------------------

describe("getUserNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("throws AppError when userId is missing", async () => {
    await expect(getUserNote("")).rejects.toThrow("User ID is required.");
  });

  it("returns default empty note when the document does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

    const result = await getUserNote("u1");

    expect(result).toEqual({ description: "", comments: [] });
  });

  it("returns note data including mapped comment dates when document exists", async () => {
    const createdAt = new Date("2024-01-01");
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        description: "Important note",
        comments: [
          {
            id: "cm1",
            author: "Admin",
            authorEmail: "admin@test.com",
            text: "Follow up needed",
            createdAt: { toDate: () => createdAt },
          },
        ],
      }),
    });

    const result = await getUserNote("u1");

    expect(result.description).toBe("Important note");
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0].text).toBe("Follow up needed");
    expect(result.comments[0].createdAt).toEqual(createdAt);
  });
});

// ---------------------------------------------------------------------------
// updateUserNote
// ---------------------------------------------------------------------------

describe("updateUserNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("throws AppError when userId is missing", async () => {
    await expect(
      updateUserNote({ userId: "", note: { description: "", comments: [] } }),
    ).rejects.toThrow("User ID is required.");
  });

  it("saves valid note to Firestore using set()", async () => {
    mockSet.mockResolvedValueOnce(undefined);

    await updateUserNote({
      userId: "u1",
      note: { description: "Test description", comments: [] },
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Test description",
        comments: [],
      }),
    );
  });

  it("throws AppError when note data fails Zod validation", async () => {
    await expect(
      updateUserNote({
        userId: "u1",
        note: {
          description: "ok",
          comments: [
            {
              id: "",
              author: "",
              authorEmail: "",
              text: "",
              createdAt: new Date(),
            },
          ],
        },
      }),
    ).rejects.toThrow();
  });
});

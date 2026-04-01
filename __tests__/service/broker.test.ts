import { describe, it, expect, vi, beforeEach } from "vitest";

// broker.ts calls firestoreAdmin() at the TOP LEVEL (const db = firestoreAdmin()).
// vi.mock is hoisted, but const declarations in the test file are NOT.
// Use vi.hoisted() to declare mock variables that are available when vi.mock factories run.
const {
  mockGet,
  mockAdd,
  mockUpdate,
  mockDelete,
  mockWhere,
  mockOrderBy,
  mockLimit,
  mockDocFn,
  mockDocRef,
  mockCollectionRef,
  mockDb,
} = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockAdd = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockSet = vi.fn();
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

  const mockDb = { collection: vi.fn().mockReturnValue(mockCollectionRef) };

  return {
    mockGet,
    mockAdd,
    mockUpdate,
    mockDelete,
    mockWhere,
    mockOrderBy,
    mockLimit,
    mockDocFn,
    mockDocRef,
    mockCollectionRef,
    mockDb,
  };
});

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldPath: { documentId: vi.fn(() => "__id__") },
  Timestamp: { now: vi.fn(() => "ts"), fromDate: vi.fn((d: any) => d) },
  FieldValue: { serverTimestamp: vi.fn() },
}));

vi.mock("@/service/bank-management", () => ({
  getBanks: vi.fn().mockResolvedValue([]),
}));

import {
  createBrokerInvitation,
  getBrokerInvitationByToken,
  acceptBrokerInvitation,
  linkClientToBroker,
  getBrokerPendingInvitations,
  getBrokerClients,
  createCommission,
  getBrokerCommissions,
  getAllBrokerInvitations,
  getAllBrokers,
  updateBrokerStatus,
} from "@/service/broker";

function resetChain() {
  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockDocFn.mockReturnValue(mockDocRef);
  mockDocRef.collection.mockReturnValue(mockCollectionRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
}

const emptySnapshot = { empty: true, docs: [] };

describe("createBrokerInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockAdd.mockResolvedValue({ id: "new-invitation-id" });
  });

  it("creates an invitation and returns a 64-char hex token", async () => {
    mockGet
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot);

    const token = await createBrokerInvitation(
      "new@example.com",
      "admin-1",
      "Admin User",
    );

    expect(token).toHaveLength(64);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        invitedBy: "admin-1",
        invitedByName: "Admin User",
        status: "Pending",
      }),
    );
  });

  it("throws when a pending invitation already exists", async () => {
    mockGet.mockResolvedValueOnce({ empty: false, docs: [{ id: "existing" }] });

    await expect(
      createBrokerInvitation("dup@example.com", "admin-1", "Admin"),
    ).rejects.toThrow("Active invitation already exists for this email");
  });

  it("throws when broker with email already exists", async () => {
    mockGet
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "broker-exists" }] });

    await expect(
      createBrokerInvitation("broker@example.com", "admin-1", "Admin"),
    ).rejects.toThrow("Broker with this email already exists");
  });
});

describe("getBrokerInvitationByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns null when no invitation found", async () => {
    mockGet.mockResolvedValueOnce(emptySnapshot);

    const result = await getBrokerInvitationByToken("invalid-token");

    expect(result).toBeNull();
  });

  it("returns the invitation when a valid non-expired token is found", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const mockInvDoc = {
      id: "inv-1",
      data: () => ({
        email: "broker@example.com",
        status: "Pending",
        expiresAt: futureDate,
        token: "valid-token",
        invitedBy: "admin-1",
        invitedByName: "Admin",
        createdAt: new Date(),
      }),
      ref: { update: vi.fn() },
    };
    mockGet.mockResolvedValueOnce({ empty: false, docs: [mockInvDoc] });

    const result = await getBrokerInvitationByToken("valid-token");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("inv-1");
    expect(result?.email).toBe("broker@example.com");
  });

  it("marks expired invitation as Expired and returns null", async () => {
    const pastDate = new Date(Date.now() - 86400000);
    const refUpdate = vi.fn().mockResolvedValue(undefined);
    const expiredDoc = {
      id: "inv-expired",
      data: () => ({
        email: "old@example.com",
        status: "Pending",
        expiresAt: pastDate,
        token: "expired-token",
        invitedBy: "admin-1",
        invitedByName: "Admin",
        createdAt: new Date(),
      }),
      ref: { update: refUpdate },
    };
    mockGet.mockResolvedValueOnce({ empty: false, docs: [expiredDoc] });

    const result = await getBrokerInvitationByToken("expired-token");

    expect(result).toBeNull();
    expect(refUpdate).toHaveBeenCalledWith({ status: "Expired" });
  });
});

describe("acceptBrokerInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockUpdate.mockResolvedValue(undefined);
  });

  it("throws when the token is invalid or expired", async () => {
    mockGet.mockResolvedValueOnce(emptySnapshot);

    await expect(acceptBrokerInvitation("bad-token")).rejects.toThrow(
      "Invalid or expired invitation",
    );
  });

  it("updates invitation status to Accepted for a valid token", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const invDoc = {
      id: "inv-10",
      data: () => ({
        email: "broker@example.com",
        status: "Pending",
        expiresAt: futureDate,
        token: "tok",
        invitedBy: "admin",
        invitedByName: "Admin",
        createdAt: new Date(),
      }),
      ref: { update: vi.fn() },
    };
    mockGet.mockResolvedValueOnce({ empty: false, docs: [invDoc] });

    await acceptBrokerInvitation("tok");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted" }),
    );
  });
});

describe("linkClientToBroker", () => {
  const linkArgs = {
    brokerId: "broker-1",
    clientId: "client-1",
    clientEmail: "client@example.com",
    clientName: "Alice Smith",
    createdBy: "Broker" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockAdd.mockResolvedValue({ id: "mapping-id" });
  });

  it("adds a new mapping when none exists", async () => {
    mockGet.mockResolvedValueOnce(emptySnapshot);

    await linkClientToBroker(linkArgs);

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        brokerId: "broker-1",
        clientId: "client-1",
        status: "Active",
      }),
    );
  });

  it("does not add a mapping when one already exists", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: "existing-mapping" }],
    });

    await linkClientToBroker(linkArgs);

    expect(mockAdd).not.toHaveBeenCalled();
  });
});

describe("getBrokerPendingInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns empty array when no pending invitations", async () => {
    mockGet.mockResolvedValueOnce(emptySnapshot);

    const result = await getBrokerPendingInvitations("broker-1");

    expect(result).toEqual([]);
  });

  it("returns pending invitations with ids", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "inv-1",
          data: () => ({ brokerId: "broker-1", status: "Pending" }),
        },
        {
          id: "inv-2",
          data: () => ({ brokerId: "broker-1", status: "Pending" }),
        },
      ],
    });

    const result = await getBrokerPendingInvitations("broker-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("inv-1");
  });

  it("queries by brokerId and Pending status", async () => {
    mockGet.mockResolvedValueOnce(emptySnapshot);

    await getBrokerPendingInvitations("broker-42");

    expect(mockWhere).toHaveBeenCalledWith("brokerId", "==", "broker-42");
    expect(mockWhere).toHaveBeenCalledWith("status", "==", "Pending");
  });
});

describe("getBrokerClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns empty array when no active client mappings exist", async () => {
    mockGet.mockResolvedValueOnce(emptySnapshot);

    const result = await getBrokerClients("broker-1");

    expect(result).toEqual([]);
  });

  it("returns enriched clients when mappings and user data exist", async () => {
    const mappingDoc = {
      id: "map-1",
      data: () => ({
        brokerId: "broker-1",
        clientId: "client-1",
        clientName: "Alice",
        clientEmail: "alice@test.com",
        status: "Active",
        createdAt: new Date(),
      }),
    };
    mockGet
      .mockResolvedValueOnce({ empty: false, docs: [mappingDoc] })
      .mockResolvedValueOnce({
        docs: [
          {
            id: "client-1",
            data: () => ({
              firstName: "Alice",
              lastName: "Smith",
              email: "alice@test.com",
              activeStatus: "Active",
            }),
          },
        ],
      });

    const result = await getBrokerClients("broker-1");

    expect(result).toHaveLength(1);
    expect(result[0].clientId).toBe("client-1");
  });

  it("filters out clients whose user data no longer exists", async () => {
    const mappingDoc = {
      id: "map-orphan",
      data: () => ({
        brokerId: "broker-1",
        clientId: "deleted-user",
        clientName: "Ghost",
        clientEmail: "ghost@test.com",
        status: "Active",
        createdAt: new Date(),
      }),
    };
    mockGet
      .mockResolvedValueOnce({ empty: false, docs: [mappingDoc] })
      .mockResolvedValueOnce({ docs: [] });

    const result = await getBrokerClients("broker-1");

    expect(result).toHaveLength(0);
  });
});

describe("createCommission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockAdd.mockResolvedValue({ id: "commission-id" });
  });

  it("adds a commission record with createdAt set", async () => {
    await createCommission({
      brokerId: "broker-1",
      clientId: "client-1",
      referenceNumber: "REF-001",
      fundMappingApprovedId: "fmap-1",
      commissionRate: 0.05,
      commissionAmount: 250,
      status: "Pending",
    });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        brokerId: "broker-1",
        commissionAmount: 250,
        status: "Pending",
        createdAt: expect.any(Date),
      }),
    );
  });
});

describe("getBrokerCommissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns all commissions for a broker", async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        {
          data: () => ({
            brokerId: "broker-1",
            commissionAmount: 100,
            status: "Pending",
          }),
        },
        {
          data: () => ({
            brokerId: "broker-1",
            commissionAmount: 200,
            status: "Paid",
          }),
        },
      ],
    });

    const result = await getBrokerCommissions("broker-1");

    expect(result).toHaveLength(2);
    expect(result[0].commissionAmount).toBe(100);
  });

  it("filters commissions by status when provided", async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        {
          data: () => ({
            brokerId: "broker-1",
            commissionAmount: 150,
            status: "Approved",
          }),
        },
      ],
    });

    const result = await getBrokerCommissions("broker-1", "Approved");

    expect(result).toHaveLength(1);
    expect(mockWhere).toHaveBeenCalledWith("status", "==", "Approved");
  });

  it("returns empty array when no commissions exist", async () => {
    mockGet.mockResolvedValueOnce({ docs: [] });

    const result = await getBrokerCommissions("broker-1");

    expect(result).toEqual([]);
  });
});

describe("getAllBrokerInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns all invitations with ids", async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        {
          id: "inv-A",
          data: () => ({ email: "a@test.com", status: "Pending" }),
        },
        {
          id: "inv-B",
          data: () => ({ email: "b@test.com", status: "Accepted" }),
        },
      ],
    });

    const result = await getAllBrokerInvitations();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("inv-A");
    expect(result[1].email).toBe("b@test.com");
    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("returns empty array when no invitations exist", async () => {
    mockGet.mockResolvedValueOnce({ docs: [] });

    const result = await getAllBrokerInvitations();

    expect(result).toEqual([]);
  });
});

describe("getAllBrokers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns all users with Broker role", async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        {
          id: "broker-1",
          data: () => ({ role: "Broker", email: "b1@test.com" }),
        },
        {
          id: "broker-2",
          data: () => ({ role: "Broker", email: "b2@test.com" }),
        },
      ],
    });

    const result = await getAllBrokers();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("broker-1");
    expect(mockWhere).toHaveBeenCalledWith("role", "==", "Broker");
  });

  it("returns empty array when no brokers exist", async () => {
    mockGet.mockResolvedValueOnce({ docs: [] });

    const result = await getAllBrokers();

    expect(result).toEqual([]);
  });
});

describe("updateBrokerStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockUpdate.mockResolvedValue(undefined);
  });

  it("throws when broker document does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    await expect(
      updateBrokerStatus({ id: "nonexistent", status: "Active" }),
    ).rejects.toThrow("Broker not found");
  });

  it("throws when user is not a broker", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ role: "Client", email: "client@test.com" }),
    });

    await expect(
      updateBrokerStatus({ id: "client-id", status: "Active" }),
    ).rejects.toThrow("User is not a broker");
  });

  it("updates activeStatus for a valid broker", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ role: "Broker", email: "broker@test.com" }),
    });

    await updateBrokerStatus({ id: "broker-1", status: "InActive" });

    expect(mockUpdate).toHaveBeenCalledWith({ activeStatus: "InActive" });
  });
});

import { describe, it, expect } from "vitest";
import {
  brokerRegistrationSchema,
  brokerInvitationSchema,
  brokerClientMappingSchema,
  brokerCommissionSchema,
} from "@/schema/broker";

describe("brokerRegistrationSchema", () => {
  const validBroker = {
    firstName: "Alice",
    lastName: "Walker",
    email: "alice@brokerage.com",
    password: "SecurePass1!",
    phoneNumber: "555-000-1234",
    role: "Broker" as const,
  };

  it("accepts valid broker registration", () => {
    const result = brokerRegistrationSchema.safeParse(validBroker);
    expect(result.success).toBe(true);
  });

  it("defaults commissionRate to 10", () => {
    const result = brokerRegistrationSchema.safeParse(validBroker);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commissionRate).toBe(10);
    }
  });

  it("defaults isOnboarded to false", () => {
    const result = brokerRegistrationSchema.safeParse(validBroker);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isOnboarded).toBe(false);
    }
  });

  it("defaults activeStatus to Active", () => {
    const result = brokerRegistrationSchema.safeParse(validBroker);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeStatus).toBe("Active");
    }
  });

  it("accepts commissionRate within 0-100", () => {
    expect(
      brokerRegistrationSchema.safeParse({
        ...validBroker,
        commissionRate: 50,
      }).success,
    ).toBe(true);
  });

  it("rejects commissionRate above 100", () => {
    expect(
      brokerRegistrationSchema.safeParse({
        ...validBroker,
        commissionRate: 101,
      }).success,
    ).toBe(false);
  });

  it("rejects commissionRate below 0", () => {
    expect(
      brokerRegistrationSchema.safeParse({
        ...validBroker,
        commissionRate: -1,
      }).success,
    ).toBe(false);
  });

  it("role must be Broker literal", () => {
    expect(
      brokerRegistrationSchema.safeParse({ ...validBroker, role: "Admin" })
        .success,
    ).toBe(false);
    expect(
      brokerRegistrationSchema.safeParse({ ...validBroker, role: "Client" })
        .success,
    ).toBe(false);
  });

  it("rejects weak password", () => {
    expect(
      brokerRegistrationSchema.safeParse({ ...validBroker, password: "weak" })
        .success,
    ).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(
      brokerRegistrationSchema.safeParse({ email: "a@b.com", role: "Broker" })
        .success,
    ).toBe(false);
  });
});

describe("brokerInvitationSchema", () => {
  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const validInvitation = {
    email: "new.broker@example.com",
    invitedBy: "admin-uid-123",
    token: "secure-token-abc",
    createdAt: now,
    expiresAt: future,
  };

  it("accepts valid invitation", () => {
    const result = brokerInvitationSchema.safeParse(validInvitation);
    expect(result.success).toBe(true);
  });

  it("defaults status to Pending", () => {
    const result = brokerInvitationSchema.safeParse(validInvitation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Pending");
    }
  });

  it("accepts Accepted status", () => {
    expect(
      brokerInvitationSchema.safeParse({
        ...validInvitation,
        status: "Accepted",
      }).success,
    ).toBe(true);
  });

  it("accepts Expired status", () => {
    expect(
      brokerInvitationSchema.safeParse({
        ...validInvitation,
        status: "Expired",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(
      brokerInvitationSchema.safeParse({
        ...validInvitation,
        status: "Revoked",
      }).success,
    ).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _, ...rest } = validInvitation;
    expect(brokerInvitationSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      brokerInvitationSchema.safeParse({
        ...validInvitation,
        email: "not-email",
      }).success,
    ).toBe(false);
  });

  it("requires createdAt date", () => {
    const { createdAt: _, ...rest } = validInvitation;
    expect(brokerInvitationSchema.safeParse(rest).success).toBe(false);
  });

  it("requires expiresAt date", () => {
    const { expiresAt: _, ...rest } = validInvitation;
    expect(brokerInvitationSchema.safeParse(rest).success).toBe(false);
  });
});

describe("brokerClientMappingSchema", () => {
  const validMapping = {
    brokerId: "broker-uid-001",
    clientId: "client-uid-002",
    clientEmail: "client@example.com",
    clientName: "Bob Client",
    createdAt: new Date(),
    createdBy: "Broker" as const,
  };

  it("accepts valid mapping", () => {
    const result = brokerClientMappingSchema.safeParse(validMapping);
    expect(result.success).toBe(true);
  });

  it("defaults status to Active", () => {
    const result = brokerClientMappingSchema.safeParse(validMapping);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Active");
    }
  });

  it("accepts createdBy Client", () => {
    expect(
      brokerClientMappingSchema.safeParse({
        ...validMapping,
        createdBy: "Client",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid createdBy", () => {
    expect(
      brokerClientMappingSchema.safeParse({
        ...validMapping,
        createdBy: "Admin",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid clientEmail", () => {
    expect(
      brokerClientMappingSchema.safeParse({
        ...validMapping,
        clientEmail: "bad-email",
      }).success,
    ).toBe(false);
  });

  it("rejects missing brokerId", () => {
    const { brokerId: _, ...rest } = validMapping;
    expect(brokerClientMappingSchema.safeParse(rest).success).toBe(false);
  });
});

describe("brokerCommissionSchema", () => {
  const validCommission = {
    brokerId: "broker-001",
    clientId: "client-001",
    clientName: "Test Client",
    fundingApplicationId: "app-001",
    fundMappingApprovedId: "map-001",
    bankName: "Chase Bank",
    fundedAmount: 50000,
    commissionRate: 5,
    commissionAmount: 2500,
    createdAt: new Date(),
  };

  it("accepts valid commission", () => {
    const result = brokerCommissionSchema.safeParse(validCommission);
    expect(result.success).toBe(true);
  });

  it("defaults status to Pending", () => {
    const result = brokerCommissionSchema.safeParse(validCommission);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Pending");
    }
  });

  it("accepts fundedAmount of 0 (min 0)", () => {
    expect(
      brokerCommissionSchema.safeParse({ ...validCommission, fundedAmount: 0 })
        .success,
    ).toBe(true);
  });

  it("rejects negative fundedAmount", () => {
    expect(
      brokerCommissionSchema.safeParse({
        ...validCommission,
        fundedAmount: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects commissionRate above 100", () => {
    expect(
      brokerCommissionSchema.safeParse({
        ...validCommission,
        commissionRate: 101,
      }).success,
    ).toBe(false);
  });

  it("rejects negative commissionAmount", () => {
    expect(
      brokerCommissionSchema.safeParse({
        ...validCommission,
        commissionAmount: -50,
      }).success,
    ).toBe(false);
  });

  it("accepts Approved and Paid statuses", () => {
    expect(
      brokerCommissionSchema.safeParse({
        ...validCommission,
        status: "Approved",
      }).success,
    ).toBe(true);
    expect(
      brokerCommissionSchema.safeParse({ ...validCommission, status: "Paid" })
        .success,
    ).toBe(true);
  });

  it("rejects missing required string fields", () => {
    const { bankName: _, ...rest } = validCommission;
    expect(brokerCommissionSchema.safeParse(rest).success).toBe(false);
  });
});

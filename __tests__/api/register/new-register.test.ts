/// <reference types="vitest/globals" />

vi.mock("@/service/user", () => ({
  registerUser: vi.fn(),
}));

vi.mock("@/service/documents", () => ({
  uploadDocument: vi.fn(),
}));

vi.mock("@/service/apply-funding", () => ({
  ensureIncomeFundingApplication: vi.fn(),
}));

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(),
}));

import { POST } from "@/app/api/register/route";
import { registerUser } from "@/service/user";
import { uploadDocument } from "@/service/documents";
import { ensureIncomeFundingApplication } from "@/service/apply-funding";

const auth = {
  firstName: "Jane",
  lastName: "Doe",
  ssn: "234-56-7890",
  phoneNumber: "555-123-4567",
  email: "jane@example.com",
  password: "Strong1!",
  consentConfirmTerms: true,
  consentConfirmPrivacy: true,
  addressStreet: "123 Main St",
  addressCity: "Manila",
  addressState: "CA",
  addressPostal: "90001",
};

const driverLicense = {
  uploaded: true,
  count: 1,
  files: [
    {
      name: "license.png",
      size: 12,
      type: "image/png",
      base64: "data:image/png;base64,aGVsbG8=",
    },
  ],
};

function request(body: object) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("current POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registerUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(uploadDocument).mockResolvedValue({} as any);
    vi.mocked(ensureIncomeFundingApplication).mockResolvedValue({
      referenceNumber: "income-user-1",
      created: true,
    });
  });

  it("creates a Financial Education user without funding data and stores the license", async () => {
    const response = await POST(
      request({
        registrationPurpose: "Financial Education",
        auth,
        documents: { driverLicense },
      }),
    );

    expect(response.status).toBe(200);
    expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationType: "Self",
        fundingData: undefined,
        user: expect.objectContaining({
          registrationPurpose: "Financial Education",
        }),
      }),
    );
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        documentType: "DRIVERS_LICENSE",
        customMetadata: expect.objectContaining({
          registrationPurpose: "Financial Education",
        }),
      }),
    );
    expect(ensureIncomeFundingApplication).toHaveBeenCalledWith("user-1");
  });

  it("rejects Financial Education registration with financial documents", async () => {
    const response = await POST(
      request({
        registrationPurpose: "Financial Education",
        auth,
        documents: {
          driverLicense,
          personalDocs: { paystubs: { count: 1, files: [{}] } },
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("preserves the existing Funding registration branch", async () => {
    const response = await POST(
      request({
        registrationPurpose: "Funding",
        auth,
        business: {
          fundingAmount: 50000,
          fundingType: "Personal",
          creditScore: 720,
          employmentType: "W2",
        },
        documents: {
          driverLicense,
          personalDocs: {
            paystubs: { uploaded: true, count: 1, files: [{}] },
          },
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({
        fundingData: expect.objectContaining({
          fundingType: "Personal",
          personalAmountFunding: 50000,
        }),
      }),
    );
    expect(uploadDocument).not.toHaveBeenCalled();
    expect(ensureIncomeFundingApplication).not.toHaveBeenCalled();
  });
});

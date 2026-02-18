import { POST } from "@/app/api/admin/clients/add/route";
import { NextRequest } from "next/server";
import { registerUser } from "@/service/user";
import AppError from "@/error/AppError";

// Mock dependencies
jest.mock("@/service/user", () => ({
  registerUser: jest.fn(),
}));

jest.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
}));

describe("POST /api/admin/clients/add", () => {
  const mockRegisterUser = registerUser as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validStep1Data = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phoneNumber: "1234567890",
    birthdate: "1990-01-01",
    gender: "Male",
    ssn: "123-45-6789",
    registrationType: "Admin",
  };

  const validStep2Data = {
    consentConfirmTerms: true,
    consentConfirmPrivacy: true,
    employmentStatus: "Employed",
    personalTaxesStatus: "Filed",
    businessTaxesStatus: "Filed",
    fundingType: "Personal",
    status: "New",
    userId: "",
    appliedDate: new Date().toISOString(),
    interestedProduct: "Business Loan",
    addressStreet: "123 Main St",
    addressCity: "New York",
    addressState: "NY",
    addressPostal: "10001",
    personalAmountFunding: 10000,
    howDoYouGetPaid: "Direct Deposit",
    moveInCurrentAddress: new Date().toISOString(),
    payPerMonth: 5000,
    rentOrMortgage: "Rent",
    legalResident: "Yes",
    driverLicenseDocuments: [
      {
        name: "license.png",
        size: 1024,
        type: "image/png",
        base64: "dGVzdA==",
      },
    ],
  };

  const createRequest = (body: any) => {
    return new NextRequest("http://localhost/api/admin/clients/add", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("should return 200 and register user when data is valid", async () => {
    mockRegisterUser.mockResolvedValue(undefined);

    const req = createRequest({
      step1Data: validStep1Data,
      step2Data: validStep2Data,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBe("Client registered successfully");
    expect(mockRegisterUser).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          email: validStep1Data.email,
          role: "Client",
          // password should be email as per implementation
          password: validStep1Data.email,
        }),
        registrationType: "Admin",
        fundingData: expect.any(Object),
      }),
    );
  });

  it("should return 400 if step1Data is missing", async () => {
    const req = createRequest({
      step2Data: validStep2Data,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toEqual(["Both step1Data and step2Data are required"]);
  });

  it("should return 400 if step2Data is missing", async () => {
    const req = createRequest({
      step1Data: validStep1Data,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toEqual(["Both step1Data and step2Data are required"]);
  });

  it("should return 400 if validation fails for step1Data", async () => {
    const invalidStep1 = { ...validStep1Data, email: "invalid-email" };
    const req = createRequest({
      step1Data: invalidStep1,
      step2Data: validStep2Data,
    });

    const response = await POST(req);
    // The helper returns JSON with errors
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it("should return 400 if validation fails for step2Data", async () => {
    const invalidStep2 = { ...validStep2Data, interestedProduct: "" };
    const req = createRequest({
      step1Data: validStep1Data,
      step2Data: invalidStep2,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
    // Validate specific error if needed, e.g., "interestedProduct is Required"
  });

  it("should return 400 if AppError occurs during registration", async () => {
    mockRegisterUser.mockRejectedValue(new AppError("User already exists"));

    const req = createRequest({
      step1Data: validStep1Data,
      step2Data: validStep2Data,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toEqual(["User already exists"]);
  });

  it("should return 500 if unexpected error occurs", async () => {
    mockRegisterUser.mockRejectedValue(new Error("Database failure"));

    const req = createRequest({
      step1Data: validStep1Data,
      step2Data: validStep2Data,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Failed to submit application");
  });
});

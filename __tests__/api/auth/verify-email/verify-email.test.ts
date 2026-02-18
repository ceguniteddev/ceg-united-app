import { GET } from "@/app/api/auth/verify-email/[token]/route";
import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/service/email-verification";
import AppError from "@/error/AppError";

// Mock dependencies
jest.mock("@/service/email-verification", () => ({
  verifyEmailToken: jest.fn(),
}));

jest.mock("@/app/api/helpers", () => ({
  badRequest: jest.fn((data) => NextResponse.json(data, { status: 400 })),
  internalServerError: jest.fn(() =>
    NextResponse.json({ message: "Internal Server Error" }, { status: 500 }),
  ),
}));

describe("GET /api/auth/verify-email/[token]", () => {
  const mockVerifyEmailToken = verifyEmailToken as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = () => {
    return new NextRequest(
      "http://localhost/api/auth/verify-email/valid-token",
    );
  };

  it("should return 200 and success result if token is valid", async () => {
    const token = "valid-token";
    const expectedResult = { success: true };

    mockVerifyEmailToken.mockResolvedValue(expectedResult);

    const req = createRequest();
    const params = Promise.resolve({ token });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expectedResult);
    expect(mockVerifyEmailToken).toHaveBeenCalledWith(token);
  });

  it("should return 400 if verification fails with AppError", async () => {
    const token = "invalid-token";
    const errorMessage = "Invalid verification token";

    mockVerifyEmailToken.mockRejectedValue(new AppError(errorMessage));

    const req = createRequest();
    const params = Promise.resolve({ token });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBe(errorMessage);
  });

  it("should return 500 if an unexpected error occurs", async () => {
    const token = "error-token";
    mockVerifyEmailToken.mockRejectedValue(new Error("Database failure"));

    const req = createRequest();
    const params = Promise.resolve({ token });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Internal Server Error");
  });
});

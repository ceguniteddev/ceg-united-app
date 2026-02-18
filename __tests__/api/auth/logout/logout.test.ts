import { POST } from "@/app/api/auth/logout/route";
import { NextRequest, NextResponse } from "next/server";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { authenticateRequest } from "@/lib/api-validation";
import { authenticationAdmin } from "@/lib/fireabase-admin";

// Mock dependencies
jest.mock("@/lib/api-validation", () => ({
  authenticateRequest: jest.fn(),
  withAuth: (handler: any) => handler,
}));

jest.mock("@/lib/fireabase-admin", () => ({
  authenticationAdmin: jest.fn(),
}));

describe("POST /api/auth/logout", () => {
  const mockAuthenticateRequest = authenticateRequest as jest.Mock;
  const mockAuthenticationAdmin = authenticationAdmin as jest.Mock;
  const mockRevokeRefreshTokens = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticationAdmin.mockReturnValue({
      revokeRefreshTokens: mockRevokeRefreshTokens,
    });
  });

  const createRequest = () => {
    return new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
    });
  };

  it("should return 200 and clear cookies on successful logout", async () => {
    const mockUid = "user123";
    mockAuthenticateRequest.mockResolvedValue({ uid: mockUid });
    mockRevokeRefreshTokens.mockResolvedValue(undefined);

    const req = createRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Logged out successfully");
    expect(mockRevokeRefreshTokens).toHaveBeenCalledWith(mockUid);

    // Verify cookie clearing
    const cookie = response.cookies.get(FIREBASE_TOKEN_NAME);
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(-1);
  });

  it("should return 401 and clear cookies if authentication fails", async () => {
    mockAuthenticateRequest.mockResolvedValue(
      NextResponse.json({ message: "Invalid token" }, { status: 401 }),
    );

    const req = createRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Invalid or expired token, clearing session.");

    // Even on auth failure, cookie should be cleared
    const cookie = response.cookies.get(FIREBASE_TOKEN_NAME);
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(-1);
  });

  it("should return 500 if an internal error occurs", async () => {
    mockAuthenticateRequest.mockResolvedValue({ uid: "user123" });
    mockRevokeRefreshTokens.mockRejectedValue(new Error("Firebase error"));

    const req = createRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe(
      "An internal server error occurred during logout.",
    );
  });
});

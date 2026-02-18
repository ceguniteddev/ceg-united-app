import { GET } from "@/app/api/auth/verify-session/route";
import { NextRequest } from "next/server";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { verifySession } from "@/lib/session";

// Mock dependencies
jest.mock("@/lib/session", () => ({
  verifySession: jest.fn(),
}));

describe("GET /api/auth/verify-session", () => {
  const mockVerifySession = verifySession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (token?: string) => {
    const req = new NextRequest("http://localhost/api/auth/verify-session");
    if (token) {
      req.cookies.set(FIREBASE_TOKEN_NAME, token);
    }
    return req;
  };

  it("should return 200 and uid if session is valid", async () => {
    const validToken = "valid-token";
    const expectedUid = "user123";

    mockVerifySession.mockResolvedValue({ uid: expectedUid });

    const req = createRequest(validToken);
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.uid).toBe(expectedUid);
    expect(mockVerifySession).toHaveBeenCalledWith(validToken);
  });

  it("should return 401 if session token is missing", async () => {
    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.valid).toBe(false);
    expect(mockVerifySession).not.toHaveBeenCalled();
  });

  it("should return 401 if session is invalid or expired", async () => {
    const invalidToken = "expired-token";
    mockVerifySession.mockResolvedValue(null);

    const req = createRequest(invalidToken);
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.valid).toBe(false);
    expect(mockVerifySession).toHaveBeenCalledWith(invalidToken);
  });

  it("should return 401 if session verification throws error", async () => {
    const errorToken = "error-token";
    mockVerifySession.mockRejectedValue(new Error("Verification failed"));

    const req = createRequest(errorToken);
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.valid).toBe(false);
    expect(mockVerifySession).toHaveBeenCalledWith(errorToken);
  });
});

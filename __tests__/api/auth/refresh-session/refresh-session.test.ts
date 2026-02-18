import { POST } from "@/app/api/auth/refresh-session/route";
import { NextRequest } from "next/server";
import { refreshSession } from "@/lib/session";

// Mock dependencies
jest.mock("@/lib/session", () => ({
  refreshSession: jest.fn(),
}));

describe("POST /api/auth/refresh-session", () => {
  const mockRefreshSession = refreshSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest("http://localhost/api/auth/refresh-session", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("should return 200 and refresh session when ID token is provided", async () => {
    const idToken = "valid-id-token";
    mockRefreshSession.mockResolvedValue(undefined);

    const req = createRequest({ idToken });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRefreshSession).toHaveBeenCalledWith(idToken);
  });

  it("should return 400 if ID token is missing", async () => {
    const req = createRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("ID token is required");
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it("should return 500 if session refresh fails", async () => {
    const idToken = "invalid-token";
    mockRefreshSession.mockRejectedValue(new Error("Refresh failed"));

    const req = createRequest({ idToken });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to refresh session");
  });
});

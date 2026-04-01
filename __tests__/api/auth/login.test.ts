import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  authFirebase: {},
}));

vi.mock("@/service/user", () => ({
  getUserById: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUser: vi.fn(),
  getUsers: vi.fn(),
  updateUserPremiumStatus: vi.fn(),
  updateUserStatus: vi.fn(),
  getUserNote: vi.fn(),
  updateUserNote: vi.fn(),
  consumeClientInvitationToken: vi.fn(),
  registerUser: vi.fn(),
  verifyClientInvitationToken: vi.fn(),
}));

import { POST } from "@/app/api/auth/login/route";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getUserById } from "@/service/user";

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "abc" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 when email is invalid", async () => {
    const res = await POST(
      makeRequest({ email: "not-an-email", password: "abc" }),
    );
    expect(res.status).toBe(400);
  });

  it("should return 403 when email is not verified", async () => {
    (signInWithEmailAndPassword as any).mockResolvedValue({
      user: {
        emailVerified: false,
        uid: "u1",
        getIdToken: vi.fn().mockResolvedValue("token"),
      },
    });

    const res = await POST(
      makeRequest({ email: "test@example.com", password: "Passw0rd!" }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/verify your email/i);
  });

  it("should return 403 when user is not found in Firestore", async () => {
    (signInWithEmailAndPassword as any).mockResolvedValue({
      user: {
        emailVerified: true,
        uid: "u1",
        email: "test@example.com",
        displayName: "Test",
        getIdToken: vi.fn().mockResolvedValue("token"),
      },
    });
    (getUserById as any).mockResolvedValue(null);

    const res = await POST(
      makeRequest({ email: "test@example.com", password: "Passw0rd!" }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/not found/i);
  });

  it("should return 200 with token on successful login", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("firebase-id-token");
    (signInWithEmailAndPassword as any).mockResolvedValue({
      user: {
        emailVerified: true,
        uid: "u1",
        email: "test@example.com",
        displayName: "Test User",
        getIdToken: mockGetIdToken,
      },
    });
    (getUserById as any).mockResolvedValue({ role: "Client" });

    const res = await POST(
      makeRequest({ email: "test@example.com", password: "Passw0rd!" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("firebase-id-token");
    expect(body.role).toBe("Client");
  });

  it("should default role to Client when user has no role", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("token");
    (signInWithEmailAndPassword as any).mockResolvedValue({
      user: {
        emailVerified: true,
        uid: "u1",
        email: "test@example.com",
        displayName: null,
        getIdToken: mockGetIdToken,
      },
    });
    (getUserById as any).mockResolvedValue({}); // no role field

    const res = await POST(
      makeRequest({ email: "test@example.com", password: "Passw0rd!" }),
    );
    const body = await res.json();
    expect(body.role).toBe("Client");
  });

  it("should return 401 for invalid credentials (auth/invalid-credential)", async () => {
    const err: any = new Error("Invalid creds");
    err.code = "auth/invalid-credential";
    (signInWithEmailAndPassword as any).mockRejectedValue(err);

    const res = await POST(
      makeRequest({ email: "test@example.com", password: "wrong" }),
    );
    expect(res.status).toBe(401);
  });

  it("should return 401 for wrong password (auth/wrong-password)", async () => {
    const err: any = new Error("Wrong pw");
    err.code = "auth/wrong-password";
    (signInWithEmailAndPassword as any).mockRejectedValue(err);

    const res = await POST(
      makeRequest({ email: "test@example.com", password: "wrong" }),
    );
    expect(res.status).toBe(401);
  });
});

import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getUserById } from "@/service/user";
import { authFirebase } from "@/lib/firebase";

// Mock dependencies
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  authFirebase: {},
}));

jest.mock("@/service/user", () => ({
  getUserById: jest.fn(),
}));

describe("POST /api/auth/login", () => {
  const mockSignIn = signInWithEmailAndPassword as jest.Mock;
  const mockGetUserById = getUserById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("should return 200 and user data when login is successful", async () => {
    const email = "test@example.com";
    const password = "Password123!";
    const uid = "user123";
    const idToken = "mock-id-token";

    // Mock Firebase sign in
    mockSignIn.mockResolvedValue({
      user: {
        uid,
        email,
        emailVerified: true,
        displayName: "Test User",
        getIdToken: jest.fn().mockResolvedValue(idToken),
      },
    });

    // Mock User DB fetch
    mockGetUserById.mockResolvedValue({
      role: "Client",
    });

    const req = createRequest({ email, password });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe(idToken);
    expect(data.email).toBe(email);
    expect(data.role).toBe("Client");
  });

  it("should return 400 if email is missing", async () => {
    const req = createRequest({ password: "Password123!" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it("should return 400 if password is missing", async () => {
    const req = createRequest({ email: "test@example.com" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it("should return 403 if email is not verified", async () => {
    mockSignIn.mockResolvedValue({
      user: {
        uid: "user123",
        email: "test@example.com",
        emailVerified: false,
      },
    });

    const req = createRequest({
      email: "test@example.com",
      password: "Password123!",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe("Please verify your email before signing in.");
  });

  it("should return 403 if user not found in database", async () => {
    mockSignIn.mockResolvedValue({
      user: {
        uid: "user123",
        email: "test@example.com",
        emailVerified: true,
      },
    });

    mockGetUserById.mockResolvedValue(null);

    const req = createRequest({
      email: "test@example.com",
      password: "Password123!",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe("User not found");
  });

  it("should return 401 for invalid credentials", async () => {
    const error: any = new Error("Auth error");
    error.code = "auth/wrong-password";
    mockSignIn.mockRejectedValue(error);

    const req = createRequest({
      email: "test@example.com",
      password: "WrongPassword",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Invalid email or password.");
  });

  it("should return 500 for internal server error", async () => {
    mockSignIn.mockRejectedValue(new Error("Database failure"));

    const req = createRequest({
      email: "test@example.com",
      password: "Password123!",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("An internal server error occurred.");
  });
});

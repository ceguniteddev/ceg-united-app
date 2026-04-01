/**
 * Tests for GET/PUT/DELETE /api/user/[userId]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock withAuth to bypass authentication in unit tests
vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
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
}));

import { GET, PUT, DELETE } from "@/app/api/user/[userId]/route";
import { getUserById, updateUserProfile, deleteUser } from "@/service/user";
import AppError from "@/error/AppError";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

describe("GET /api/user/[userId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/x");
    const res = await GET(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should return user data on success", async () => {
    (getUserById as any).mockResolvedValue({ id: "u1", name: "Jane" });
    const req = new NextRequest("http://localhost/api/user/u1");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "u1", name: "Jane" });
  });

  it("should return 400 when service throws AppError", async () => {
    (getUserById as any).mockRejectedValue(new AppError("Not found"));
    const req = new NextRequest("http://localhost/api/user/u1");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 500 on unexpected error", async () => {
    (getUserById as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/user/u1");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/user/[userId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/x", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Bob" }),
    });
    const res = await PUT(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should update user and return 200", async () => {
    (updateUserProfile as any).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/user/u1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PUT(req, params("u1"));
    expect(updateUserProfile).toHaveBeenCalledWith({
      userId: "u1",
      data: { name: "Updated" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/updated/i);
  });

  it("should return 400 when service throws AppError", async () => {
    (updateUserProfile as any).mockRejectedValue(new AppError("Conflict"));
    const req = new NextRequest("http://localhost/api/user/u1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await PUT(req, params("u1"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/user/[userId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/x", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should delete user and return 200", async () => {
    (deleteUser as any).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/user/u1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params("u1"));
    expect(deleteUser).toHaveBeenCalledWith("u1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/deleted/i);
  });

  it("should return 400 when service throws AppError", async () => {
    (deleteUser as any).mockRejectedValue(new AppError("Cannot delete"));
    const req = new NextRequest("http://localhost/api/user/u1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params("u1"));
    expect(res.status).toBe(400);
  });
});

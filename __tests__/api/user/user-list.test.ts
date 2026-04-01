/**
 * Tests for GET /api/user  (list users by role)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUser: vi.fn(),
}));

import { GET } from "@/app/api/user/route";
import { getUsers } from "@/service/user";

describe("GET /api/user", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when role is missing", async () => {
    const req = new NextRequest("http://localhost/api/user");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when role is invalid", async () => {
    const req = new NextRequest("http://localhost/api/user?role=SuperAdmin");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("should return list of users for valid role", async () => {
    const mockUsers = [{ id: "u1", name: "Alice", role: "Client" }];
    (getUsers as any).mockResolvedValue(mockUsers);

    const req = new NextRequest("http://localhost/api/user?role=Client");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockUsers);
  });

  it("should accept Admin role", async () => {
    (getUsers as any).mockResolvedValue([]);
    const req = new NextRequest("http://localhost/api/user?role=Admin");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("should accept Broker role", async () => {
    (getUsers as any).mockResolvedValue([]);
    const req = new NextRequest("http://localhost/api/user?role=Broker");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("should return 500 on unexpected service error", async () => {
    (getUsers as any).mockRejectedValue(new Error("DB down"));
    const req = new NextRequest("http://localhost/api/user?role=Client");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

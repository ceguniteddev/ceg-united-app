/**
 * Tests for GET and POST /api/user/[userId]/notes
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
  getUserNote: vi.fn(),
  updateUserNote: vi.fn(),
  getUserById: vi.fn(),
}));

import { GET, POST } from "@/app/api/user/[userId]/notes/route";
import { getUserNote, updateUserNote } from "@/service/user";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

describe("GET /api/user/[userId]/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/u1/notes");
    const res = await GET(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should return note data on success", async () => {
    const mockNote = { description: "Test note", comments: [] };
    (getUserNote as any).mockResolvedValue(mockNote);
    const req = new NextRequest("http://localhost/api/user/u1/notes");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockNote);
  });

  it("should return 500 on unexpected error", async () => {
    (getUserNote as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/user/u1/notes");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/user/[userId]/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/u1/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description: "Note" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should update note and return 200", async () => {
    (updateUserNote as any).mockResolvedValue(undefined);
    const note = { description: "My note", comments: [] };
    const req = new NextRequest("http://localhost/api/user/u1/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(note),
    });
    const res = await POST(req, params("u1"));
    expect(updateUserNote).toHaveBeenCalledWith({ userId: "u1", note });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/updated/i);
  });

  it("should return 500 on unexpected error", async () => {
    (updateUserNote as any).mockRejectedValue(new Error("Write failed"));
    const req = new NextRequest("http://localhost/api/user/u1/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req, params("u1"));
    expect(res.status).toBe(500);
  });
});

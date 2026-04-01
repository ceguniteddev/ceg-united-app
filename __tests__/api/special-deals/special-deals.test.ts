/**
 * Tests for:
 *   GET  /api/special-deals
 *   POST /api/special-deals
 *   GET  /api/special-deals/[dealId]
 *   PUT  /api/special-deals/[dealId]
 *   DELETE /api/special-deals/[dealId]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/special-deals", () => ({
  getAllSpecialDeals: vi.fn(),
  getActiveSpecialDeals: vi.fn(),
  createSpecialDeal: vi.fn(),
  getSpecialDealById: vi.fn(),
  updateSpecialDeal: vi.fn(),
  deleteSpecialDeal: vi.fn(),
  toggleSpecialDealActive: vi.fn(),
}));

import {
  GET as listDeals,
  POST as createDeal,
} from "@/app/api/special-deals/route";
import {
  GET as getDeal,
  PUT as updateDeal,
  DELETE as deleteDeal,
} from "@/app/api/special-deals/[dealId]/route";
import {
  getAllSpecialDeals,
  getActiveSpecialDeals,
  createSpecialDeal,
  getSpecialDealById,
  updateSpecialDeal,
  deleteSpecialDeal,
  toggleSpecialDealActive,
} from "@/service/special-deals";

const dealParams = (dealId: string) =>
  ({ params: Promise.resolve({ dealId }) }) as any;

const validDealBody = {
  bank_name: "Test Bank",
  card_id: "CARD-001",
  credit_limit: 5000,
  date_opened: "2024-01-01",
  stock: 10,
  base_price: 100,
  tag: "Flash Sale",
  discountPercent: 20,
  originalPrice: 500,
  salePrice: 400,
  expiresAt: "2025-12-31",
  isActive: true,
};

// ---------------------------------------------------------------------------
// GET /api/special-deals
// ---------------------------------------------------------------------------
describe("GET /api/special-deals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return all deals when activeOnly is not set", async () => {
    const mockDeals = [{ id: "d1" }, { id: "d2" }];
    (getAllSpecialDeals as any).mockResolvedValue(mockDeals);

    const req = new NextRequest("http://localhost/api/special-deals");
    const res = await listDeals(req);
    expect(res.status).toBe(200);
    expect(getAllSpecialDeals).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body).toEqual(mockDeals);
  });

  it("should return only active deals when activeOnly=true", async () => {
    const activeDeals = [{ id: "d1", isActive: true }];
    (getActiveSpecialDeals as any).mockResolvedValue(activeDeals);

    const req = new NextRequest(
      "http://localhost/api/special-deals?activeOnly=true",
    );
    const res = await listDeals(req);
    expect(res.status).toBe(200);
    expect(getActiveSpecialDeals).toHaveBeenCalledOnce();
    expect(getAllSpecialDeals).not.toHaveBeenCalled();
  });

  it("should return 500 on service error", async () => {
    (getAllSpecialDeals as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/special-deals");
    const res = await listDeals(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/special-deals
// ---------------------------------------------------------------------------
describe("POST /api/special-deals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when required fields are missing", async () => {
    const req = new NextRequest("http://localhost/api/special-deals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bank_name: "Only Bank" }),
    });
    const res = await createDeal(req);
    expect(res.status).toBe(400);
  });

  it("should create a deal and return 201 on valid input", async () => {
    (createSpecialDeal as any).mockResolvedValue("new-deal-id");
    const req = new NextRequest("http://localhost/api/special-deals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validDealBody),
    });
    const res = await createDeal(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("new-deal-id");
    expect(body.success).toBe(true);
  });

  it("should calculate salePrice from originalPrice and discountPercent", async () => {
    (createSpecialDeal as any).mockResolvedValue("deal-id");
    const req = new NextRequest("http://localhost/api/special-deals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...validDealBody,
        originalPrice: 1000,
        discountPercent: 25,
      }),
    });
    await createDeal(req);
    expect(createSpecialDeal).toHaveBeenCalledWith(
      expect.objectContaining({ salePrice: 750 }),
    );
  });

  it("should return 500 on service error", async () => {
    (createSpecialDeal as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/special-deals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validDealBody),
    });
    const res = await createDeal(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/special-deals/[dealId]
// ---------------------------------------------------------------------------
describe("GET /api/special-deals/[dealId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when dealId is missing", async () => {
    const req = new NextRequest("http://localhost/api/special-deals/x");
    const res = await getDeal(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should return 404 when deal is not found", async () => {
    (getSpecialDealById as any).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/special-deals/d1");
    const res = await getDeal(req, dealParams("d1"));
    expect(res.status).toBe(404);
  });

  it("should return deal data on success", async () => {
    const mockDeal = { id: "d1", bank_name: "Test Bank" };
    (getSpecialDealById as any).mockResolvedValue(mockDeal);
    const req = new NextRequest("http://localhost/api/special-deals/d1");
    const res = await getDeal(req, dealParams("d1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockDeal);
  });

  it("should return 500 on service error", async () => {
    (getSpecialDealById as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/special-deals/d1");
    const res = await getDeal(req, dealParams("d1"));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/special-deals/[dealId]
// ---------------------------------------------------------------------------
describe("PUT /api/special-deals/[dealId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when dealId is missing", async () => {
    const req = new NextRequest("http://localhost/api/special-deals/x", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validDealBody),
    });
    const res = await updateDeal(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should toggle active status when action=toggleActive", async () => {
    (toggleSpecialDealActive as any).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/special-deals/d1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "toggleActive", isActive: false }),
    });
    const res = await updateDeal(req, dealParams("d1"));
    expect(toggleSpecialDealActive).toHaveBeenCalledWith("d1", false);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should update deal on valid input", async () => {
    (updateSpecialDeal as any).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/special-deals/d1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validDealBody),
    });
    const res = await updateDeal(req, dealParams("d1"));
    expect(updateSpecialDeal).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("should return 400 for invalid update body", async () => {
    const req = new NextRequest("http://localhost/api/special-deals/d1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bank_name: "" }), // invalid
    });
    const res = await updateDeal(req, dealParams("d1"));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/special-deals/[dealId]
// ---------------------------------------------------------------------------
describe("DELETE /api/special-deals/[dealId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when dealId is missing", async () => {
    const req = new NextRequest("http://localhost/api/special-deals/x", {
      method: "DELETE",
    });
    const res = await deleteDeal(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should delete deal and return 200", async () => {
    (deleteSpecialDeal as any).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/special-deals/d1", {
      method: "DELETE",
    });
    const res = await deleteDeal(req, dealParams("d1"));
    expect(deleteSpecialDeal).toHaveBeenCalledWith("d1");
    expect(res.status).toBe(200);
  });

  it("should return 500 on service error", async () => {
    (deleteSpecialDeal as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/special-deals/d1", {
      method: "DELETE",
    });
    const res = await deleteDeal(req, dealParams("d1"));
    expect(res.status).toBe(500);
  });
});

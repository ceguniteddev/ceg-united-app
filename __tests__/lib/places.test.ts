import { describe, it, expect, vi, beforeEach } from "vitest";

const { findNearestBranchesN8N } = vi.hoisted(() => ({
  findNearestBranchesN8N: vi.fn(),
}));

vi.mock("@/service/n8n", () => ({
  findNearestBranchesN8N,
}));

import { findNearestBranches } from "@/lib/funding-playbook/places";

const sampleBranch = {
  placeId: "ChIJhUPI0J6VD4gRggAT5sx1QDY",
  name: "Consumers Credit Union (CCU) Headquarters",
  address: "300 N Field Dr, Lake Forest, IL 60045, USA",
  lat: 42.2449345,
  lng: -87.8991072,
  distanceMiles: 1.5,
  rating: 2.4,
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Google&query_place_id=ChIJhUPI0J6VD4gRggAT5sx1QDY",
};

describe("findNearestBranches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes mapped parameters to the n8n service", async () => {
    findNearestBranchesN8N.mockResolvedValue([{ branches: [] }]);

    await findNearestBranches({
      lenderDisplayName: "Chase",
      limit: 5,
      userId: "user-123",
    });

    expect(findNearestBranchesN8N).toHaveBeenCalledWith({
      userId: "user-123",
      lenderDisplayName: "Chase",
    });
  });

  it("falls back to 'Lender' when displayName is empty", async () => {
    findNearestBranchesN8N.mockResolvedValue([{ branches: [] }]);

    await findNearestBranches({ lenderDisplayName: "", limit: 5 });

    expect(findNearestBranchesN8N).toHaveBeenCalledWith(
      expect.objectContaining({ lenderDisplayName: "Lender" }),
    );
  });

  it("unwraps the array-wrapped { branches } response shape", async () => {
    findNearestBranchesN8N.mockResolvedValue([{ branches: [sampleBranch] }]);

    const result = await findNearestBranches({
      lenderDisplayName: "CCU",
      limit: 5,
    });

    expect(result).toEqual([sampleBranch]);
  });

  it("unwraps a direct { branches } object response shape", async () => {
    findNearestBranchesN8N.mockResolvedValue({ branches: [sampleBranch] });

    const result = await findNearestBranches({
      lenderDisplayName: "CCU",
      limit: 5,
    });

    expect(result).toEqual([sampleBranch]);
  });

  it("accepts a bare array of branch objects", async () => {
    findNearestBranchesN8N.mockResolvedValue([sampleBranch]);

    const result = await findNearestBranches({
      lenderDisplayName: "CCU",
      limit: 5,
    });

    expect(result).toEqual([sampleBranch]);
  });

  it("slices results to the requested limit", async () => {
    const many = Array.from({ length: 10 }).map((_, i) => ({
      ...sampleBranch,
      placeId: `place-${i}`,
    }));
    findNearestBranchesN8N.mockResolvedValue([{ branches: many }]);

    const result = await findNearestBranches({
      lenderDisplayName: "CCU",
      limit: 3,
    });

    expect(result).toHaveLength(3);
    expect(result[0].placeId).toBe("place-0");
  });

  it("normalizes optional fields and coerces required fields", async () => {
    findNearestBranchesN8N.mockResolvedValue([
      {
        branches: [
          {
            placeId: "p1",
            name: "Branch",
            address: "123 Main St",
            lat: "42.5",
            lng: "-87.1",
            distanceMiles: "2.3",
            phone: 5551234,
            hours: ["Mon: 9-5"],
            openNow: true,
          },
        ],
      },
    ]);

    const [branch] = await findNearestBranches({
      lenderDisplayName: "CCU",
      limit: 5,
    });

    expect(branch).toEqual({
      placeId: "p1",
      name: "Branch",
      address: "123 Main St",
      lat: 42.5,
      lng: -87.1,
      distanceMiles: 2.3,
      phone: "5551234",
      hours: ["Mon: 9-5"],
      openNow: true,
    });
    expect(branch).not.toHaveProperty("rating");
    expect(branch).not.toHaveProperty("googleMapsUrl");
  });

  it("returns an empty array for an unrecognized response shape", async () => {
    findNearestBranchesN8N.mockResolvedValue({ unexpected: true });

    const result = await findNearestBranches({
      lenderDisplayName: "CCU",
      limit: 5,
    });

    expect(result).toEqual([]);
  });

  it("propagates errors from the n8n service", async () => {
    findNearestBranchesN8N.mockRejectedValue(new Error("n8n webhook error"));

    await expect(
      findNearestBranches({ lenderDisplayName: "CCU", limit: 5 }),
    ).rejects.toThrow("n8n webhook error");
  });
});

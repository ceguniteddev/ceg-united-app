import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MembershipCache } from "@/lib/membership-cache";
import { UserMembership } from "@/schema/users";

describe("MembershipCache", () => {
  let cache: MembershipCache;
  const mockMembership: UserMembership = {
    id: "mem_1",
    tier: "tier_pro",
    amount: 50,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    // Instantiate with a 2-second TTL and a small max size of 3 for testing
    cache = new MembershipCache(2000, 3);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should retrieve set data before TTL expires", () => {
    cache.set("user_1", mockMembership);
    expect(cache.get("user_1")).toEqual(mockMembership);
  });

  it("should return undefined for non-existent keys", () => {
    expect(cache.get("user_nonexistent")).toBeUndefined();
  });

  it("should return undefined and delete entry when TTL expires", () => {
    cache.set("user_1", mockMembership);

    // Advance time by 1.999 seconds (not expired yet)
    vi.advanceTimersByTime(1999);
    expect(cache.get("user_1")).toEqual(mockMembership);

    // Advance time past TTL (2 seconds total)
    vi.advanceTimersByTime(1);
    expect(cache.get("user_1")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("should overwrite/update an existing key and reset its expiration", () => {
    cache.set("user_1", mockMembership);
    vi.advanceTimersByTime(1000);

    const updatedMembership = { ...mockMembership, id: "mem_2" };
    cache.set("user_1", updatedMembership);

    // After another 1.5 seconds, user_1 would have expired if the TTL was not reset.
    // Since it was reset, it should still be valid.
    vi.advanceTimersByTime(1500);
    expect(cache.get("user_1")).toEqual(updatedMembership);

    // Advance past the new TTL
    vi.advanceTimersByTime(500);
    expect(cache.get("user_1")).toBeUndefined();
  });

  it("should invalidate a specific key", () => {
    cache.set("user_1", mockMembership);
    expect(cache.get("user_1")).toEqual(mockMembership);

    cache.invalidate("user_1");
    expect(cache.get("user_1")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("should clear all entries in the cache", () => {
    cache.set("user_1", mockMembership);
    cache.set("user_2", mockMembership);
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("user_1")).toBeUndefined();
    expect(cache.get("user_2")).toBeUndefined();
  });

  it("should prune expired entries when limit is reached", () => {
    // Limit is 3
    cache.set("user_1", mockMembership);
    cache.set("user_2", mockMembership);

    // Let user_1 and user_2 expire
    vi.advanceTimersByTime(2500);

    // Adding third and fourth entries should trigger pruneExpired and delete user_1 & user_2
    cache.set("user_3", mockMembership);
    cache.set("user_4", mockMembership);

    expect(cache.size()).toBe(2); // user_1 and user_2 got pruned, so user_3 and user_4 are left
    expect(cache.get("user_1")).toBeUndefined();
    expect(cache.get("user_2")).toBeUndefined();
    expect(cache.get("user_3")).toEqual(mockMembership);
    expect(cache.get("user_4")).toEqual(mockMembership);
  });

  it("should evict the oldest entry if pruning does not free up enough space when limit is reached", () => {
    // Limit is 3. Set 3 active entries
    cache.set("user_1", mockMembership);
    vi.advanceTimersByTime(100);
    cache.set("user_2", mockMembership);
    vi.advanceTimersByTime(100);
    cache.set("user_3", mockMembership);

    expect(cache.size()).toBe(3);

    // Set 4th active entry. Since none are expired, the oldest key ('user_1') must be evicted.
    cache.set("user_4", mockMembership);

    expect(cache.size()).toBe(3);
    expect(cache.get("user_1")).toBeUndefined(); // Evicted (oldest)
    expect(cache.get("user_2")).toEqual(mockMembership);
    expect(cache.get("user_3")).toEqual(mockMembership);
    expect(cache.get("user_4")).toEqual(mockMembership);
  });
});

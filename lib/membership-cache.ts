import { UserMembership } from "@/schema/users";

export interface CacheEntry {
  data: UserMembership | null;
  expiresAt: number;
}

export class MembershipCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(ttl = 120000, maxSize = 2000) {
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  /**
   * Returns the cached data if it exists and is not expired; otherwise deletes it and returns undefined.
   */
  get(userId: string): UserMembership | null | undefined {
    const entry = this.cache.get(userId);
    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(userId);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Stores the data with expiresAt calculated as Date.now() + TTL.
   * If cache exceeds max size, synchronously prunes expired entries, or clears oldest entries.
   */
  set(userId: string, data: UserMembership | null): void {
    if (!this.cache.has(userId) && this.cache.size >= this.maxSize) {
      this.pruneExpired();

      // If pruning did not free up enough space, evict the oldest entries
      while (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey === undefined) {
          break; // Safety breakout if cache is somehow empty
        }
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(userId, {
      data,
      expiresAt: Date.now() + this.ttl,
    });
  }

  /**
   * Removes the cached entry for the given userId.
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Synchronously prunes expired entries from the cache.
   */
  private pruneExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  /**
   * Returns the current size of the cache. Primarily useful for testing or debugging.
   */
  size(): number {
    return this.cache.size;
  }
}

const membershipCache = new MembershipCache();
export default membershipCache;

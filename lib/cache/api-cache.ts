/**
 * High-Performance In-Memory Cache with TTL and Mutation Invalidation.
 * Dramatically cuts latency for serverless database queries across regions.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<any>>();

export async function fetchWithCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryStore.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const freshData = await fetcher();
  memoryStore.set(key, {
    data: freshData,
    expiresAt: now + ttlSeconds * 1000,
  });

  return freshData;
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix?: string): void {
  if (!keyOrPrefix) {
    memoryStore.clear();
    return;
  }

  for (const key of memoryStore.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      memoryStore.delete(key);
    }
  }
}

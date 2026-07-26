type CacheEntry<T> = {
  value: T;
  createdAt: number;
  expiresAt: number;
  staleUntil: number;
};

type GlobalCacheStore = Map<string, CacheEntry<unknown>>;

declare global {
  // eslint-disable-next-line no-var
  var __MAPA_DO_ATIVO_API_CACHE__: GlobalCacheStore | undefined;
}

const cacheStore: GlobalCacheStore = globalThis.__MAPA_DO_ATIVO_API_CACHE__ ?? new Map();

globalThis.__MAPA_DO_ATIVO_API_CACHE__ = cacheStore;

function now() {
  return Date.now();
}

export type CacheRead<T> = {
  value: T | null;
  state: "hit" | "stale" | "miss";
  ageMs: number | null;
};

export function getCachedValue<T>(key: string): CacheRead<T> {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return { value: null, state: "miss", ageMs: null };
  }

  const currentTime = now();

  if (entry.staleUntil <= currentTime) {
    cacheStore.delete(key);
    return { value: null, state: "miss", ageMs: null };
  }

  const ageMs = currentTime - entry.createdAt;

  if (entry.expiresAt > currentTime) {
    return { value: entry.value, state: "hit", ageMs };
  }

  return { value: entry.value, state: "stale", ageMs };
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number, staleTtlMs = ttlMs * 8): T {
  const createdAt = now();

  cacheStore.set(key, {
    value,
    createdAt,
    expiresAt: createdAt + ttlMs,
    staleUntil: createdAt + staleTtlMs
  });

  return value;
}

export function deleteCachedValue(key: string) {
  cacheStore.delete(key);
}

export function clearApiCache() {
  cacheStore.clear();
}

export function getCacheStats() {
  const currentTime = now();
  let fresh = 0;
  let stale = 0;
  let expired = 0;

  for (const entry of cacheStore.values()) {
    if (entry.staleUntil <= currentTime) {
      expired += 1;
    } else if (entry.expiresAt > currentTime) {
      fresh += 1;
    } else {
      stale += 1;
    }
  }

  return {
    total: cacheStore.size,
    fresh,
    stale,
    expired
  };
}

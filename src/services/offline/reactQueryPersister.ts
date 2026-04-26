/**
 * reactQueryPersister.ts
 *
 * MMKV-backed query cache persistence using React Query v5's built-in
 * dehydrate/hydrate APIs — no extra packages needed.
 *
 * Pattern:
 *  1. On app boot → hydrate queryClient from MMKV
 *  2. After each successful query → dehydrate & persist to MMKV
 *  3. Cache is evicted if older than CACHE_MAX_AGE_MS
 */

import { cacheStorage } from '@/lib/mmkv';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';

const CACHE_KEY = 'rq_cache_v2';
const CACHE_TS_KEY = 'rq_cache_ts_v2';

/** 12-hour max cache age */
export const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 12;

// ── Save ───────────────────────────────────────────────────────────────────────

export function persistQueryCache(client: QueryClient): void {
  try {
    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: (query) => query.state.status === 'success',
    });
    cacheStorage.set(CACHE_KEY, JSON.stringify(dehydrated));
    cacheStorage.set(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // Never crash the app on a cache write failure
  }
}

// ── Restore ────────────────────────────────────────────────────────────────────

export function restoreQueryCache(client: QueryClient): void {
  try {
    const ts = Number(cacheStorage.getString(CACHE_TS_KEY) ?? '0');
    if (Date.now() - ts > CACHE_MAX_AGE_MS) {
      cacheStorage.remove(CACHE_KEY);
      cacheStorage.remove(CACHE_TS_KEY);
      return;
    }
    const raw = cacheStorage.getString(CACHE_KEY);
    if (!raw) return;
    const dehydrated = JSON.parse(raw);
    hydrate(client, dehydrated);
  } catch {
    // Corrupted cache — ignore and continue
  }
}

// ── Clear ──────────────────────────────────────────────────────────────────────

export function clearQueryCache(): void {
  cacheStorage.remove(CACHE_KEY);
  cacheStorage.remove(CACHE_TS_KEY);
}


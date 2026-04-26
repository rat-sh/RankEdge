/**
 * rateLimit.ts
 *
 * Simple in-process rate limiter for exam submission and auth operations.
 * Backed by MMKV so limits survive app restarts within the window.
 *
 * Prevents:
 *  - Multiple exam submissions (1 per exam per user)
 *  - Brute-force PIN attempts (handled in authStore)
 *  - Rapid API flooding from repeated taps
 */

import { cacheStorage } from '@/lib/mmkv';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * @param key       Unique key e.g. `submit_exam_${userId}_${examId}`
 * @param limit     Max calls per window
 * @param windowMs  Window size in milliseconds
 * @returns { allowed, remaining, retryAfterMs }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const raw = cacheStorage.getString(`rl_${key}`);
  let entry: RateLimitEntry = raw ? JSON.parse(raw) : { count: 0, windowStart: now };

  // Reset window if expired
  if (now - entry.windowStart > windowMs) {
    entry = { count: 0, windowStart: now };
  }

  if (entry.count >= limit) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  cacheStorage.set(`rl_${key}`, JSON.stringify(entry));
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/**
 * Convenience: one-shot guard. Exam can only be submitted once.
 * Returns true if this is the first attempt for this user+exam.
 */
export function guardOneShot(key: string): boolean {
  const storageKey = `oneshot_${key}`;
  if (cacheStorage.getBoolean(storageKey)) return false;
  cacheStorage.set(storageKey, true);
  return true;
}

/** Reset one-shot guard (e.g., after a confirmed submission succeeds) */
export function clearOneShot(key: string): void {
  cacheStorage.remove(`oneshot_${key}`);
}

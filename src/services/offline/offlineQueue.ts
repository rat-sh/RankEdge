/**
 * offlineQueue.ts
 * 
 * Offline mutation queue with MMKV persistence.
 * When the device is offline, any writes (answers, doubts, submissions)
 * are stored here and replayed when connectivity returns.
 */

import { offlineQueueStorage } from '@/lib/mmkv';
import { supabase } from '@/lib/supabase/client';

const QUEUE_KEY = 'pending_mutations';

export type MutationType =
  | 'INSERT'
  | 'UPDATE'
  | 'UPSERT';

export interface PendingMutation {
  id: string;               // uuid for deduplication
  table: string;            // supabase table name
  type: MutationType;
  payload: Record<string, any>;
  matchKey?: string;        // column for UPDATE/UPSERT match
  matchValue?: any;
  createdAt: number;        // unix ms, for TTL eviction
}

// ── Queue management ───────────────────────────────────────────────────────────

function readQueue(): PendingMutation[] {
  try {
    const raw = offlineQueueStorage.getString(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingMutation[];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingMutation[]): void {
  offlineQueueStorage.set(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(mutation: Omit<PendingMutation, 'id' | 'createdAt'>): void {
  const queue = readQueue();
  queue.push({
    ...mutation,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  writeQueue(queue);
}

export function dequeue(id: string): void {
  const queue = readQueue().filter(m => m.id !== id);
  writeQueue(queue);
}

export function getPendingCount(): number {
  return readQueue().length;
}

/** Remove items older than 24 h to prevent unbounded growth */
function evictStale(): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const queue = readQueue().filter(m => m.createdAt > cutoff);
  writeQueue(queue);
}

// ── Replay ─────────────────────────────────────────────────────────────────────

/**
 * Called when connectivity is restored. Replays each mutation in order.
 * Successfully applied mutations are removed from the queue.
 * Failures are left in the queue for the next attempt.
 */
export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  evictStale();
  const queue = readQueue();
  if (!queue.length) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      let q: any = supabase.from(mutation.table);
      if (mutation.type === 'INSERT') {
        q = q.insert(mutation.payload);
      } else if (mutation.type === 'UPDATE' && mutation.matchKey) {
        q = q.update(mutation.payload).eq(mutation.matchKey, mutation.matchValue);
      } else if (mutation.type === 'UPSERT') {
        q = q.upsert(mutation.payload);
      }
      const { error } = await q;
      if (error) throw error;
      dequeue(mutation.id);
      flushed++;
    } catch {
      failed++;
      // leave in queue; will retry on next connectivity event
    }
  }

  return { flushed, failed };
}

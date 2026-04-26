/**
 * useOfflineMutation.ts
 *
 * Drop-in wrapper around supabase mutations that queues writes
 * when offline and executes them immediately when online.
 *
 * Usage:
 *   const { mutate } = useOfflineMutation({ table: 'doubts', type: 'INSERT' });
 *   mutate(payload, { onSuccess: () => ... });
 */

import { useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { enqueue, PendingMutation } from '@/services/offline/offlineQueue';
import { supabase } from '@/lib/supabase/client';

interface UseOfflineMutationOptions {
  table: string;
  type: PendingMutation['type'];
  matchKey?: string;
}

interface MutateOptions<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onQueued?: () => void;       // called when queued offline (no data available yet)
}

export function useOfflineMutation<TPayload extends Record<string, any>>({ table, type, matchKey }: UseOfflineMutationOptions) {
  const { isOnline } = useNetworkStatus();

  const mutate = useCallback(
    async (payload: TPayload, opts: MutateOptions = {}) => {
      if (!isOnline) {
        enqueue({ table, type, payload, matchKey, matchValue: matchKey ? payload[matchKey] : undefined });
        opts.onQueued?.();
        return;
      }

      try {
        let q: any = supabase.from(table);
        if (type === 'INSERT') q = q.insert(payload);
        else if (type === 'UPDATE' && matchKey) q = q.update(payload).eq(matchKey, payload[matchKey]);
        else if (type === 'UPSERT') q = q.upsert(payload);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        opts.onSuccess?.(data);
      } catch (e: any) {
        // If it was a network error, queue it
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('Network request failed')) {
          enqueue({ table, type, payload, matchKey, matchValue: matchKey ? payload[matchKey] : undefined });
          opts.onQueued?.();
        } else {
          opts.onError?.(e);
        }
      }
    },
    [isOnline, table, type, matchKey]
  );

  return { mutate, isOnline };
}

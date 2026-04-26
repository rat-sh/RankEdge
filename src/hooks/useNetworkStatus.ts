/**
 * useNetworkStatus.ts
 *
 * Lightweight connectivity hook using React Native's built-in AppState
 * + a fast fetch probe. No expo-network dependency required.
 *
 * The probe hits a tiny Supabase health endpoint (or falls back to
 * a well-known public URL that never changes).
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { flushQueue, getPendingCount } from '@/services/offline/offlineQueue';

const PROBE_URL = 'https://connectivitycheck.gstatic.com/generate_204';
const PROBE_TIMEOUT_MS = 4000;

async function isReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(PROBE_URL, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export interface NetworkStatus {
  isOnline: boolean;
  pendingSync: number;
  checkNow: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(getPendingCount());
  const checkingRef = useRef(false);

  const checkConnectivity = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const online = await isReachable();
      setIsOnline(online);
      if (online) {
        const { flushed } = await flushQueue();
        if (flushed > 0) setPendingSync(getPendingCount());
      }
      setPendingSync(getPendingCount());
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    // Re-check when app returns to foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkConnectivity();
    });

    // Poll every 30 s
    const poll = setInterval(checkConnectivity, 30_000);

    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, [checkConnectivity]);

  return { isOnline, pendingSync, checkNow: checkConnectivity };
}

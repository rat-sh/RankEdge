import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import {
  restoreQueryCache,
  persistQueryCache,
  CACHE_MAX_AGE_MS,
} from '@/services/offline/reactQueryPersister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,          // 5 min — in-memory freshness
      gcTime: CACHE_MAX_AGE_MS,           // 12 h — keep in memory GC window
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnReconnect: 'always',
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Hydrate cache from MMKV before first render
restoreQueryCache(queryClient);

function CachePersister() {
  useEffect(() => {
    // Subscribe to query changes and persist successful results
    const unsub = queryClient.getQueryCache().subscribe(() => {
      persistQueryCache(queryClient);
    });
    return unsub;
  }, []);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            {/* Persist cache to MMKV on every query change */}
            <CachePersister />
            {/* Animated offline banner — slides in when offline */}
            <OfflineBanner />
            <AppNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

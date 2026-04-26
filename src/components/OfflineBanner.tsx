/**
 * OfflineBanner.tsx
 *
 * Slim banner that appears at the top of the screen when offline.
 * Shows pending sync count so users know their data is queued.
 *
 * Usage: render once in AppNavigator or RootLayout.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSync } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? -48 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY }] }]}>
      <View style={s.dot} />
      <Text style={s.text}>
        {pendingSync > 0
          ? `Offline — ${pendingSync} change${pendingSync !== 1 ? 's' : ''} queued`
          : 'You are offline. Changes will sync when reconnected.'}
      </Text>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#78350F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  text: {
    fontSize: 13,
    color: '#FDE68A',
    fontWeight: '600',
  },
});

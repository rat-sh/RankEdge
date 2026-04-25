import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

export const sessionStorage: MMKV = createMMKV({ id: 'session' });
export const offlineQueueStorage: MMKV = createMMKV({ id: 'offline-queue' });
export const cacheStorage: MMKV = createMMKV({ id: 'cache' });
export const settingsStorage: MMKV = createMMKV({ id: 'settings' });

export const zustandMMKVStorage = {
  getItem: (key: string): string | null => {
    const value = sessionStorage.getString(key);
    return value !== undefined ? value : null;
  },
  setItem: (key: string, value: string): void => {
    sessionStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    sessionStorage.remove(key);
  },
};

import { MMKV } from 'react-native-mmkv';

export const sessionStorage = new MMKV({ id: 'session' });
export const offlineQueueStorage = new MMKV({ id: 'offline-queue' });
export const cacheStorage = new MMKV({ id: 'cache' });
export const settingsStorage = new MMKV({ id: 'settings' });

export const zustandMMKVStorage = {
  getItem: (key: string) => sessionStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => sessionStorage.set(key, value),
  removeItem: (key: string) => sessionStorage.delete(key),
};

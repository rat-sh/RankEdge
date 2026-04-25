import { offlineQueueStorage } from '@/lib/mmkv';

export type QueuedAction = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
  retries: number;
};

const KEY = 'offline_queue';
const get = (): QueuedAction[] => {
  const r = offlineQueueStorage.getString(KEY);
  return r ? JSON.parse(r) : [];
};
const save = (q: QueuedAction[]) => offlineQueueStorage.set(KEY, JSON.stringify(q));

export const enqueue = (type: string, payload: unknown) => {
  const q = get();
  q.push({ id: Math.random().toString(36).slice(2), type, payload, createdAt: Date.now(), retries: 0 });
  save(q);
};

export const peek = () => get();

export const flushQueue = async (executor: (a: QueuedAction) => Promise<void>, maxRetries = 3) => {
  const queue = get();
  const failed: QueuedAction[] = [];
  for (const action of queue) {
    try { await executor(action); }
    catch { if (action.retries < maxRetries) failed.push({ ...action, retries: action.retries + 1 }); }
  }
  save(failed);
};

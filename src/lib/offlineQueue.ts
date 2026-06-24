import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'parallax:offline_submit_queue';

export interface PendingSubmit {
  id: string;
  coupleId: string;
  picks: (number | null)[];
  hunches: (number | null)[];
  queuedAt: number;
}

async function readQueue(): Promise<PendingSubmit[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingSubmit[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingSubmit[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueSubmit(
  coupleId: string,
  picks: (number | null)[],
  hunches: (number | null)[]
): Promise<void> {
  const queue = await readQueue();
  const id = `${coupleId}:${Date.now()}`;
  const existing = queue.findIndex((item) => item.coupleId === coupleId);
  if (existing !== -1) {
    queue[existing] = { id, coupleId, picks, hunches, queuedAt: Date.now() };
  } else {
    queue.push({ id, coupleId, picks, hunches, queuedAt: Date.now() });
  }
  await writeQueue(queue);
}

export async function flushQueue(
  submitFn: (coupleId: string, picks: (number | null)[], hunches: (number | null)[]) => Promise<unknown>
): Promise<{ flushed: number; failed: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;
  const remaining: PendingSubmit[] = [];

  for (const item of queue) {
    try {
      await submitFn(item.coupleId, item.picks, item.hunches);
      flushed++;
    } catch {
      failed++;
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return { flushed, failed };
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueLength(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

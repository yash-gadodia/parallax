import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueSubmit,
  flushQueue,
  clearQueue,
  getQueueLength,
} from './offlineQueue';

beforeEach(async () => {
  await clearQueue();
});

describe('enqueueSubmit', () => {
  it('adds a pending item to the queue', async () => {
    await enqueueSubmit('couple-1', [0, 1, 2], [2, 1, 0]);
    expect(await getQueueLength()).toBe(1);
  });

  it('dedupes: a second enqueue for the same coupleId replaces the first', async () => {
    await enqueueSubmit('couple-1', [0, 1, 2], [2, 1, 0]);
    await enqueueSubmit('couple-1', [1, 1, 1], [0, 0, 0]);
    expect(await getQueueLength()).toBe(1);
    const raw = await AsyncStorage.getItem('parallax:offline_submit_queue');
    const queue = JSON.parse(raw!);
    expect(queue[0].picks).toEqual([1, 1, 1]);
    expect(queue[0].hunches).toEqual([0, 0, 0]);
  });

  it('allows multiple different coupleIds in the queue', async () => {
    await enqueueSubmit('couple-1', [0, 1, 2], [2, 1, 0]);
    await enqueueSubmit('couple-2', [1, 0, 2], [0, 2, 1]);
    expect(await getQueueLength()).toBe(2);
  });

  it('stores coupleId, picks and hunches exactly', async () => {
    await enqueueSubmit('couple-42', [3, null, 1], [null, 2, 0]);
    const raw = await AsyncStorage.getItem('parallax:offline_submit_queue');
    const queue = JSON.parse(raw!);
    expect(queue[0].coupleId).toBe('couple-42');
    expect(queue[0].picks).toEqual([3, null, 1]);
    expect(queue[0].hunches).toEqual([null, 2, 0]);
  });
});

describe('flushQueue', () => {
  it('calls submitFn for each item and removes them on success', async () => {
    await enqueueSubmit('couple-1', [0, 1, 2], [2, 1, 0]);
    await enqueueSubmit('couple-2', [1, 0, 2], [0, 2, 1]);

    const submitFn = jest.fn().mockResolvedValue('done');
    const result = await flushQueue(submitFn);

    expect(submitFn).toHaveBeenCalledTimes(2);
    expect(submitFn).toHaveBeenCalledWith('couple-1', [0, 1, 2], [2, 1, 0]);
    expect(submitFn).toHaveBeenCalledWith('couple-2', [1, 0, 2], [0, 2, 1]);
    expect(result.flushed).toBe(2);
    expect(result.failed).toBe(0);
    expect(await getQueueLength()).toBe(0);
  });

  it('keeps failed items in the queue and counts them', async () => {
    await enqueueSubmit('couple-1', [0, 1, 2], [2, 1, 0]);
    await enqueueSubmit('couple-2', [1, 0, 2], [0, 2, 1]);

    const submitFn = jest
      .fn()
      .mockResolvedValueOnce('done')
      .mockRejectedValueOnce(new Error('network error'));

    const result = await flushQueue(submitFn);

    expect(result.flushed).toBe(1);
    expect(result.failed).toBe(1);
    expect(await getQueueLength()).toBe(1);
  });

  it('returns 0/0 and does not call submitFn when queue is empty', async () => {
    const submitFn = jest.fn();
    const result = await flushQueue(submitFn);
    expect(submitFn).not.toHaveBeenCalled();
    expect(result).toEqual({ flushed: 0, failed: 0 });
  });

  it('passes the exact picks and hunches stored during enqueue', async () => {
    await enqueueSubmit('couple-99', [3, null, 0], [null, 1, 2]);
    const submitFn = jest.fn().mockResolvedValue(undefined);
    await flushQueue(submitFn);
    expect(submitFn).toHaveBeenCalledWith('couple-99', [3, null, 0], [null, 1, 2]);
  });
});

describe('clearQueue', () => {
  it('empties the queue completely', async () => {
    await enqueueSubmit('couple-1', [0, 1, 2], [2, 1, 0]);
    await clearQueue();
    expect(await getQueueLength()).toBe(0);
  });
});

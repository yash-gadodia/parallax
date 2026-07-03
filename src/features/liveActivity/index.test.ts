import { AppState } from 'react-native';
import type { WidgetSnapshot } from '../widget/snapshot';
import {
  attachLiveActivityLifecycle,
  syncLiveActivityFromSnapshot,
  __resetLiveActivityForTests,
} from './index';
import { startOrUpdateStreakActivity, endStreakActivity } from './bridge';

jest.mock('./bridge', () => ({
  startOrUpdateStreakActivity: jest.fn().mockResolvedValue(true),
  endStreakActivity: jest.fn().mockResolvedValue(true),
}));

const startMock = startOrUpdateStreakActivity as jest.Mock;
const endMock = endStreakActivity as jest.Mock;

const snap = (over: Partial<WidgetSnapshot> = {}): WidgetSnapshot => ({
  state: 'risk',
  partnerName: 'Dani',
  wavePct: 0,
  streak: 14,
  date: '2026-07-02',
  ...over,
});

const AT_RISK = new Date(2026, 6, 2, 20, 48, 0); // 3h12m of runway
const MIDNIGHT_JULY_3 = new Date(2026, 6, 3, 0, 0, 0).getTime();

beforeEach(() => {
  __resetLiveActivityForTests();
  startMock.mockClear();
  endMock.mockClear();
});

describe('syncLiveActivityFromSnapshot', () => {
  it('starts the countdown once for an at-risk snapshot, with exact native args', () => {
    syncLiveActivityFromSnapshot(snap(), AT_RISK);
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledWith(14, MIDNIGHT_JULY_3, '2026-07-02');
    expect(endMock).not.toHaveBeenCalled();
  });

  it('dedupes identical re-syncs (realtime refetch spam never hits the bridge twice)', () => {
    syncLiveActivityFromSnapshot(snap(), AT_RISK);
    syncLiveActivityFromSnapshot(snap(), new Date(2026, 6, 2, 21, 15, 0));
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it('ends the activity the moment the drop reveals', () => {
    syncLiveActivityFromSnapshot(snap(), AT_RISK);
    syncLiveActivityFromSnapshot(
      snap({ state: 'synced', wavePct: 83 }),
      new Date(2026, 6, 2, 21, 30, 0)
    );
    expect(endMock).toHaveBeenCalledTimes(1);
  });

  it('applies the very first directive even when it is an end (stray teardown on launch)', () => {
    syncLiveActivityFromSnapshot(snap({ state: 'waiting' }), new Date(2026, 6, 2, 9, 0, 0));
    expect(endMock).toHaveBeenCalledTimes(1);
    expect(startMock).not.toHaveBeenCalled();
    // ...but repeated end directives stay deduped.
    syncLiveActivityFromSnapshot(snap({ state: 'waiting' }), new Date(2026, 6, 2, 9, 5, 0));
    expect(endMock).toHaveBeenCalledTimes(1);
  });

  it('a growing streak on the same night updates the activity (new directive key)', () => {
    syncLiveActivityFromSnapshot(snap(), AT_RISK);
    syncLiveActivityFromSnapshot(snap({ streak: 15 }), new Date(2026, 6, 2, 21, 0, 0));
    expect(startMock).toHaveBeenCalledTimes(2);
    expect(startMock).toHaveBeenLastCalledWith(15, MIDNIGHT_JULY_3, '2026-07-02');
  });
});

describe('attachLiveActivityLifecycle', () => {
  let handler: ((status: string) => void) | undefined;
  let removeMock: jest.Mock;

  beforeEach(() => {
    removeMock = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      fn: (status: string) => void
    ) => {
      handler = fn;
      return { remove: removeMock };
    }) as unknown as typeof AppState.addEventListener);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('starts the countdown on foreground after the 20:00 boundary passed in the background', () => {
    jest.useFakeTimers();
    // App synced at 19:00 — waiting, no activity yet.
    jest.setSystemTime(new Date(2026, 6, 2, 19, 0, 0));
    const sub = attachLiveActivityLifecycle();
    syncLiveActivityFromSnapshot(snap({ state: 'waiting' }), new Date());
    expect(startMock).not.toHaveBeenCalled();

    // User re-opens the app at 20:05 — same snapshot, fresh clock.
    jest.setSystemTime(new Date(2026, 6, 2, 20, 5, 0));
    handler?.('active');
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledWith(14, MIDNIGHT_JULY_3, '2026-07-02');

    sub.remove();
    expect(removeMock).toHaveBeenCalledTimes(1);
  });

  it('ignores background/inactive transitions (iOS cannot start an activity there)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 2, 20, 5, 0));
    attachLiveActivityLifecycle();
    syncLiveActivityFromSnapshot(snap({ state: 'waiting' }), new Date(2026, 6, 2, 19, 0, 0));
    endMock.mockClear();
    startMock.mockClear();

    handler?.('background');
    handler?.('inactive');
    expect(startMock).not.toHaveBeenCalled();
    expect(endMock).not.toHaveBeenCalled();
  });

  it('tears down yesterday\'s activity on the first morning foreground', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 2, 22, 0, 0));
    attachLiveActivityLifecycle();
    syncLiveActivityFromSnapshot(snap(), new Date()); // live countdown last night
    expect(startMock).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date(2026, 6, 3, 8, 0, 0)); // next morning
    handler?.('active');
    expect(endMock).toHaveBeenCalledTimes(1);
  });
});

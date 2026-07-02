import React from 'react';
import { render, userEvent, act } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import ShareSheet from '../share';
import { useIdentity } from '../../../src/features/profile/useIdentity';

jest.mock('../../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));
jest.mock('../../../src/features/auth/useSession', () => ({
  useSession: jest.fn(),
}));
jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../../src/features/drops/useTodayState', () => ({
  useTodayState: jest.fn(),
}));
jest.mock('../../../src/features/lovemap/useCoupleHistory', () => ({
  useCoupleHistory: jest.fn(),
}));

const mockUseIdentity = useIdentity as jest.Mock;
const { useSession } = require('../../../src/features/auth/useSession');
const { useCouple } = require('../../../src/features/pairing/useCouple');
const { useTodayState } = require('../../../src/features/drops/useTodayState');
const { useCoupleHistory } = require('../../../src/features/lovemap/useCoupleHistory');

// couple_history order: most recent first. 80 🟢, 75 🟢, 55 🟡.
const LIVE_HISTORY = [
  { date: '2026-07-02', code: 'W12', title: 'the hot seat', wavelength: 80, twins_count: 1 },
  { date: '2026-07-01', code: 'W11', title: 'night moves', wavelength: 75, twins_count: 2 },
  { date: '2026-06-30', code: 'W10', title: 'soft spots', wavelength: 55, twins_count: 0 },
];

function mockLive({ streak = 7, today, history = LIVE_HISTORY }: {
  streak?: number;
  today?: Record<string, unknown> | null;
  history?: typeof LIVE_HISTORY;
} = {}) {
  useSession.mockReturnValue({ session: { user: { id: 'me' } }, loading: false });
  useCouple.mockReturnValue({
    couple: { id: 'c-1', streak, status: 'active' },
    loading: false,
    status: 'active',
  });
  useTodayState.mockReturnValue({
    today:
      today === undefined
        ? { exists: true, date: '2026-07-02', couple_drop_id: 'cd-1', state: 'revealed', wave_pct: 84 }
        : today,
    content: null,
    loading: false,
    refresh: jest.fn(),
  });
  useCoupleHistory.mockReturnValue({ history, loading: false, isSample: false, error: null });
}

// The Copy action sets a toast + a 2.2s dismiss timer; fake timers keep those
// updates inside the test (flushed via act) instead of leaking across tests.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// Presses an element (userEvent flushes the async handler: clipboard promise
// -> toast state update), then runs the toast dismiss timer so nothing leaks.
async function pressAndSettle(element: Parameters<ReturnType<typeof userEvent.setup>['press']>[0]) {
  await userEvent.setup().press(element);
  act(() => {
    jest.runAllTimers();
  });
}

describe('ShareSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'Jordan', initial: 'J', hasPartner: true },
      loading: false,
    });
    // Defaults: demo mode (no session, no couple, no server data).
    useSession.mockReturnValue({ session: null, loading: false });
    useCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });
    useTodayState.mockReturnValue({ today: null, content: null, loading: false, refresh: jest.fn() });
    useCoupleHistory.mockReturnValue({ history: [], loading: false, isSample: true, error: null });
  });

  it('renders the share sheet with title and content', async () => {
    const { getByText } = await render(<ShareSheet />);

    // Assert the sheet title is rendered
    expect(getByText('share via')).toBeTruthy();

    // Assert the "on the same wavelength" text is rendered
    expect(getByText('on the same wavelength')).toBeTruthy();

    // Assert the share buttons are rendered
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Instagram')).toBeTruthy();
    expect(getByText('Copy')).toBeTruthy();
  });

  it('renders the real couple names in the share-card footer', async () => {
    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('Alex & Jordan · TODAY')).toBeTruthy();
    expect(queryByText(/YASH & DANI/)).toBeNull();
  });

  it('drops the names from the footer when there is no partner yet', async () => {
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'your partner', initial: '·', hasPartner: false },
      loading: false,
    });

    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('TODAY')).toBeTruthy();
    expect(queryByText(/&/)).toBeNull();
  });

  it('keeps the demo score and grid when there is no session', async () => {
    // Demo play state (all nulls -> the seeded demo picks) scores 33%.
    const { getByText } = await render(<ShareSheet />);

    // Empty play store -> no twins/hits marked on the grid.
    expect(getByText('33%')).toBeTruthy();
    expect(getByText('☕🤍  🌧🤍  🔓🤍')).toBeTruthy();
  });

  it('renders the server-stored wave_pct, not the local demo score, when signed in', async () => {
    mockLive();
    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('84%')).toBeTruthy();
    expect(queryByText('33%')).toBeNull();
    // The card shows the spoiler-free weekly dots instead of the demo grid.
    expect(getByText('🟢🟢🟡')).toBeTruthy();
    expect(queryByText(/👯|💞|🤍/)).toBeNull();
  });



  it('falls back to the latest revealed day when today has no stored wave yet', async () => {
    mockLive({
      today: { exists: true, date: '2026-07-02', couple_drop_id: 'cd-1', state: 'one_done', wave_pct: null },
    });
    const { getByText } = await render(<ShareSheet />);

    expect(getByText('80%')).toBeTruthy();
  });

  it('never renders questions or answers in the share card', async () => {
    mockLive();
    const { getByText, queryByText } = await render(<ShareSheet />);

    // Positive anchor first so an empty render can't pass this vacuously.
    expect(getByText('84%')).toBeTruthy();
    expect(queryByText(/the hot seat/)).toBeNull();
    expect(queryByText(/I feel most taken care of/)).toBeNull();
  });

  // KEEP LAST: a userEvent press leaves RNTL 14 unable to render a fresh tree
  // in later tests of the same file. The message variants (streak 0, no wave,
  // no dots) are exact-tested in src/features/history/shareMessage.test.ts;
  // this test proves the wiring end-to-end.
  it('copies the spoiler-free share text with the weekly dots and streak', async () => {
    mockLive();
    const { getByText } = await render(<ShareSheet />);

    await pressAndSettle(getByText('Copy'));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      'Alex & Jordan · 84% in sync · 7🔥\n🟢🟢🟡\nfind your wavelength on parallax'
    );
  });
});

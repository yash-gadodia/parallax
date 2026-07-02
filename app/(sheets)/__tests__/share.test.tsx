import React from 'react';
import { render, userEvent, act, fireEvent } from '@testing-library/react-native';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import ShareSheet from '../share';
import { useIdentity } from '../../../src/features/profile/useIdentity';

// Local router mock: the share buttons close the sheet via safeBack, which
// needs canGoBack (absent from the global expo-router mock).
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    dismiss: jest.fn(),
    canGoBack: () => false,
  }),
}));

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
const mockCaptureRef = captureRef as jest.Mock;
const { useSession } = require('../../../src/features/auth/useSession');
const { useCouple } = require('../../../src/features/pairing/useCouple');
const { useTodayState } = require('../../../src/features/drops/useTodayState');
const { useCoupleHistory } = require('../../../src/features/lovemap/useCoupleHistory');

// couple_history order: most recent first. 80 🟢, 75 🟢, 55 🟡.
const LIVE_HISTORY = [
  { date: '2026-07-02', code: 'W12', title: 'the hot seat', wavelength: 80, twins_count: 1, caught_up: false },
  { date: '2026-07-01', code: 'W11', title: 'night moves', wavelength: 75, twins_count: 2, caught_up: false },
  { date: '2026-06-30', code: 'W10', title: 'soft spots', wavelength: 55, twins_count: 0, caught_up: false },
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
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
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

  it('renders the real couple names, partner-color-coded, on the card', async () => {
    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('Alex & Jordan')).toBeTruthy();
    // The two partner-colored Toks (p1 you / p2 partner) carry the initials;
    // they're decorative (a11y-hidden), so include hidden elements.
    expect(getByText('A', { includeHiddenElements: true })).toBeTruthy();
    expect(getByText('J', { includeHiddenElements: true })).toBeTruthy();
    expect(queryByText(/YASH & DANI/)).toBeNull();
  });

  it('drops the partner from the card when there is no partner yet', async () => {
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'your partner', initial: '·', hasPartner: false },
      loading: false,
    });

    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('Alex')).toBeTruthy();
    expect(queryByText(/&/)).toBeNull();
  });

  it('keeps the demo score and grid when there is no session', async () => {
    // Demo play state (all nulls -> the seeded demo picks) scores 33%.
    const { getByText, queryByText } = await render(<ShareSheet />);

    // Empty play store -> no twins/hits marked on the grid.
    expect(getByText('33%')).toBeTruthy();
    expect(getByText('☕🤍  🌧🤍  🔓🤍')).toBeTruthy();
    // No couple -> no streak line on the card.
    expect(queryByText(/🔥/)).toBeNull();
  });

  it('renders the server-stored wave_pct, not the local demo score, when signed in', async () => {
    mockLive();
    const { getByText, getByTestId, queryByText, queryByTestId } = await render(<ShareSheet />);

    expect(getByText('84%')).toBeTruthy();
    expect(queryByText('33%')).toBeNull();
    // The card shows the spoiler-free weekly dots instead of the demo grid.
    expect(getByTestId('share-dot-0')).toHaveTextContent('🟢');
    expect(getByTestId('share-dot-1')).toHaveTextContent('🟢');
    expect(getByTestId('share-dot-2')).toHaveTextContent('🟡');
    expect(queryByTestId('share-dot-3')).toBeNull();
    expect(queryByText(/👯|💞|🤍/)).toBeNull();
  });

  it('shows the streak on the card', async () => {
    mockLive({ streak: 12 });
    const { getByText } = await render(<ShareSheet />);

    expect(getByText('12🔥')).toBeTruthy();
  });

  it('hides the streak line at streak 0', async () => {
    mockLive({ streak: 0 });
    const { queryByText } = await render(<ShareSheet />);

    expect(queryByText(/🔥/)).toBeNull();
  });

  it('renders a caught-up day muted, a normal day full-strength', async () => {
    mockLive({
      history: [
        { ...LIVE_HISTORY[0], caught_up: true },
        LIVE_HISTORY[1],
        LIVE_HISTORY[2],
      ],
    });
    const { getByTestId } = await render(<ShareSheet />);

    expect(getByTestId('share-dot-0')).toHaveTextContent('🟢');
    expect(getByTestId('share-dot-0')).toHaveStyle({ opacity: 0.45 });
    expect(getByTestId('share-dot-1')).toHaveStyle({ opacity: 1 });
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

  it('shares the captured 9:16 card image on Messages', async () => {
    mockLive();
    const { getByText } = await render(<ShareSheet />);

    await act(async () => {
      fireEvent.press(getByText('Messages'));
    });

    expect(mockCaptureRef).toHaveBeenCalledWith(expect.anything(), {
      format: 'png',
      quality: 1,
      width: 1080,
      height: 1920,
    });
    expect(shareSpy).toHaveBeenCalledWith({ url: 'file:///mock/share-card.png' });
  });

  it('falls back to the spoiler-free text share when capture fails', async () => {
    mockLive();
    mockCaptureRef.mockRejectedValueOnce(new Error('snapshot failed'));
    const { getByText } = await render(<ShareSheet />);

    await act(async () => {
      fireEvent.press(getByText('Instagram'));
    });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith({
      message: 'Alex & Jordan · 84% in sync · 7🔥\n🟢🟢🟡\nfind your wavelength on parallax',
    });
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

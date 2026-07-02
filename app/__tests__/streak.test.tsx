import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import StreakScreen from '../streak';
import type { Couple } from '../../src/types/db';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

const mockPurchases = { isPro: false };
jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn(
    (selector: (s: { isPro: boolean }) => unknown) => selector(mockPurchases)
  ),
}));

const mockRpc = jest.fn();
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const mockUseCouple = jest.fn();
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => mockUseCouple(),
}));

jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: () => ({
    me: { name: 'Yash', initial: 'Y' },
    partner: { name: 'Dani', initial: 'D', hasPartner: true },
    loading: false,
  }),
}));

const pairedCouple = {
  id: 'couple-1',
  streak: 3,
  longest_streak: 9,
  freezes_remaining: 2,
} as Couple;

const lapsedCouple = {
  id: 'couple-1',
  streak: 0,
  longest_streak: 9,
  freezes_remaining: 1,
  lapsed_streak: 5,
  lapsed_on: '2026-07-01',
} as unknown as Couple;

const zeroSurface = {
  streak: 0,
  longest_streak: 9,
  freezes_remaining: 1,
  week: [false, false, false, false, false, false, false],
};

describe('StreakScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockPurchases.isPro = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('paired: renders the real server surface — exact week grid, freezes, longest streak', async () => {
    mockUseCouple.mockReturnValue({ couple: pairedCouple, loading: false, status: 'active' });
    mockRpc.mockResolvedValue({
      data: {
        streak: 12,
        longest_streak: 20,
        freezes_remaining: 1,
        // Oldest first, today (index 6) last — 5 filled days.
        week: [true, true, true, true, true, false, false],
      },
      error: null,
    });

    const { findAllByText, getByText, getByTestId, queryByText } = await render(<StreakScreen />);

    // Streak number comes from the server surface, not couples.streak.
    // (GradientText renders its string twice: mask + gradient fill.)
    expect((await findAllByText('12')).length).toBe(2);
    expect(mockRpc).toHaveBeenCalledWith('get_streak_surface', { p_couple: 'couple-1' });
    expect(mockRpc).toHaveBeenCalledTimes(1);

    // Week grid: exactly 5 filled dots (0-4) and 2 empty (5-6), from `week`.
    for (const idx of [0, 1, 2, 3, 4]) {
      expect(getByTestId(`week-dot-${idx}-filled`)).toBeTruthy();
    }
    for (const idx of [5, 6]) {
      expect(getByTestId(`week-dot-${idx}-empty`)).toBeTruthy();
    }

    // Freezes shown honestly from freezes_remaining; the fake Arm flow is gone.
    expect(getByText('Streak freeze · 1 equipped')).toBeTruthy();
    expect(
      getByText('Auto-used if you miss a day. Life happens — a freeze saves the streak for both of you. Every full week earns one back (max 2).')
    ).toBeTruthy();
    expect(queryByText('Arm')).toBeNull();
    expect(queryByText('Armed')).toBeNull();

    // Longest streak is the real longest_streak, not the current streak.
    expect(getByText('longest streak together · 20 days')).toBeTruthy();

    // Nothing lapsed -> no repair card at all.
    expect(queryByText('Repair your streak')).toBeNull();
  });

  it('lapsed streak, non-Plus: shows the repair card and routes to the paywall, never repairs silently', async () => {
    mockUseCouple.mockReturnValue({ couple: lapsedCouple, loading: false, status: 'active' });
    mockRpc.mockResolvedValue({ data: zeroSurface, error: null });

    const { getByText } = await render(<StreakScreen />);

    expect(getByText('Repair your streak')).toBeTruthy();
    expect(
      getByText('Your 5-day streak lapsed. Repair it within 7 days and it comes back — for both of you.')
    ).toBeTruthy();

    fireEvent.press(getByText('Repair with Plus'));

    expect(mockPush).toHaveBeenCalledWith('/(sheets)/plus');
    // Only the surface fetch hit the server — repair_streak was never called.
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('get_streak_surface', { p_couple: 'couple-1' });
  });

  it('lapsed streak, Plus: repairs for real through repair_streak and confirms', async () => {
    mockPurchases.isPro = true;
    mockUseCouple.mockReturnValue({ couple: lapsedCouple, loading: false, status: 'active' });
    mockRpc.mockImplementation((fn: unknown) =>
      fn === 'repair_streak'
        ? Promise.resolve({ data: { streak: 5 }, error: null })
        : Promise.resolve({ data: zeroSurface, error: null })
    );

    const { getByText, queryByText } = await render(<StreakScreen />);

    await act(async () => {
      fireEvent.press(getByText('Repair it — free with Plus'));
    });

    expect(mockRpc).toHaveBeenCalledWith('repair_streak', { p_couple: 'couple-1' });
    expect(getByText('streak repaired — 5 days back')).toBeTruthy();
    expect(queryByText('Repair your streak')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('lapsed streak, Plus: a failed repair shows the honest toast and keeps the card', async () => {
    mockPurchases.isPro = true;
    mockUseCouple.mockReturnValue({ couple: lapsedCouple, loading: false, status: 'active' });
    mockRpc.mockImplementation((fn: unknown) =>
      fn === 'repair_streak'
        ? Promise.resolve({ data: null, error: { message: 'window passed' } })
        : Promise.resolve({ data: zeroSurface, error: null })
    );

    const { getByText } = await render(<StreakScreen />);

    await act(async () => {
      fireEvent.press(getByText('Repair it — free with Plus'));
    });

    expect(getByText("Couldn't repair the streak — try again.")).toBeTruthy();
    expect(getByText('Repair your streak')).toBeTruthy();
  });

  it('paired but RPC fails: falls back to couple row values with the synthetic week fill', async () => {
    mockUseCouple.mockReturnValue({ couple: pairedCouple, loading: false, status: 'active' });
    mockRpc.mockResolvedValue({ data: null, error: { message: 'offline' } });

    const { getAllByText, getByText, getByTestId } = await render(<StreakScreen />);

    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(1));

    // couples.streak = 3 -> synthetic fill lights the trailing 3 dots (4, 5, 6).
    expect(getAllByText('3').length).toBe(2);
    for (const idx of [0, 1, 2, 3]) {
      expect(getByTestId(`week-dot-${idx}-empty`)).toBeTruthy();
    }
    for (const idx of [4, 5, 6]) {
      expect(getByTestId(`week-dot-${idx}-filled`)).toBeTruthy();
    }
    expect(getByText('Streak freeze · 2 equipped')).toBeTruthy();
    expect(getByText('longest streak together · 9 days')).toBeTruthy();
  });

  it('demo (no couple): keeps the local fallback, never fetches, and never shows an armed freeze', async () => {
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });

    const { getAllByText, getByText, getByTestId, queryByText } = await render(<StreakScreen />);

    expect(mockRpc).not.toHaveBeenCalled();

    // Demo streak is 0 -> all 7 dots empty.
    expect(getAllByText('0').length).toBe(2);
    for (const idx of [0, 1, 2, 3, 4, 5, 6]) {
      expect(getByTestId(`week-dot-${idx}-empty`)).toBeTruthy();
    }

    // Default 2 freezes shown honestly; no arm/armed state exists at all.
    expect(getByText('Streak freeze · 2 equipped')).toBeTruthy();
    expect(queryByText('Arm')).toBeNull();
    expect(queryByText('Armed')).toBeNull();
    expect(queryByText(/Freeze armed/)).toBeNull();

    // Static sections still render.
    expect(getByText('your streak')).toBeTruthy();
    expect(getByText('day shared streak')).toBeTruthy();
    expect(getByText('this week')).toBeTruthy();
    expect(getByText('milestones · next at 7')).toBeTruthy();
    expect(getByText('longest streak together · 0 days')).toBeTruthy();
  });
});

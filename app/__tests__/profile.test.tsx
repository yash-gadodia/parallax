import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../profile';
import { useTodayState } from '../../src/features/drops/useTodayState';
import type { TodayState } from '../../src/types/db';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(() => ({
    couple: { id: 'test-couple-id' },
  })),
}));

jest.mock('../../src/features/engagement/engagementActions', () => ({
  nudge: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/features/drops/useTodayState', () => ({
  useTodayState: jest.fn(),
}));

jest.mock('../../src/features/profile/useProfile', () => ({
  useProfile: jest.fn(),
}));

import { useProfile } from '../../src/features/profile/useProfile';

const mockUseTodayState = useTodayState as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;

const PROFILE = {
  name: 'Alex',
  partnerName: 'Jordan',
  spiceLevel: 'Spicy',
  notifyTime: null,
  togetherSince: 'March 2023',
  streak: 42,
  loading: false,
  updateProfile: jest.fn(),
};

function todayState(overrides: Partial<TodayState>): TodayState {
  return {
    exists: true,
    date: '2026-07-02',
    couple_drop_id: 'cd-1',
    state: 'open',
    wave_pct: null,
    i_answered: false,
    partner_answered: false,
    held: false,
    ...overrides,
  };
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockUseTodayState.mockReturnValue({ today: null, loading: false, refresh: jest.fn() });
    mockUseProfile.mockReturnValue(PROFILE);
  });

  it('renders real identity from useProfile', async () => {
    const { getByText } = await render(<ProfileScreen />);

    expect(getByText('Alex')).toBeTruthy();
    expect(getByText('paired with')).toBeTruthy();
    expect(getByText('Jordan')).toBeTruthy();
    expect(getByText('Spicy')).toBeTruthy();
  });

  it('shows identity skeletons while the profile loads — never a name flash', async () => {
    mockUseProfile.mockReturnValue({ ...PROFILE, loading: true });

    const { getByTestId, queryByText } = await render(<ProfileScreen />);

    expect(getByTestId('profile-skeleton-tok')).toBeTruthy();
    expect(getByTestId('profile-skeleton-name')).toBeTruthy();
    expect(getByTestId('profile-skeleton-pair')).toBeTruthy();
    expect(queryByText('Alex')).toBeNull();
    expect(queryByText('paired with')).toBeNull();
    expect(queryByText('Jordan')).toBeNull();
  });

  it('shows the nudge banner only when I answered and my partner has not', async () => {
    mockUseTodayState.mockReturnValue({
      today: todayState({ state: 'one_done', i_answered: true, partner_answered: false }),
      loading: false,
      refresh: jest.fn(),
    });

    const { getByText } = await render(<ProfileScreen />);

    expect(getByText('Give Jordan a nudge')).toBeTruthy();
    expect(getByText("they haven't played today's drop")).toBeTruthy();
    expect(getByText('Send a nudge')).toBeTruthy();
  });

  it('hides the nudge banner when there is no today state', async () => {
    const { queryByText } = await render(<ProfileScreen />);

    expect(queryByText('Give Jordan a nudge')).toBeNull();
    expect(queryByText('Send a nudge')).toBeNull();
  });

  it("hides the nudge banner when I haven't answered yet", async () => {
    mockUseTodayState.mockReturnValue({
      today: todayState({ state: 'open', i_answered: false, partner_answered: false }),
      loading: false,
      refresh: jest.fn(),
    });

    const { queryByText } = await render(<ProfileScreen />);

    expect(queryByText('Give Jordan a nudge')).toBeNull();
  });

  it('hides the nudge banner when my partner already answered', async () => {
    mockUseTodayState.mockReturnValue({
      today: todayState({ state: 'revealed', i_answered: true, partner_answered: true }),
      loading: false,
      refresh: jest.fn(),
    });

    const { queryByText } = await render(<ProfileScreen />);

    expect(queryByText('Give Jordan a nudge')).toBeNull();
  });

  it('renders preferences and account sections', async () => {
    const { getByText } = await render(<ProfileScreen />);

    expect(getByText('preferences')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('account')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
    expect(getByText('Unpair from Jordan')).toBeTruthy();
  });

  it('offers a link to the science behind parallax in preferences', async () => {
    const { getByText } = await render(<ProfileScreen />);
    expect(getByText('The science behind parallax')).toBeTruthy();
  });
});

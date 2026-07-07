/**
 * V2 F2 repair check-in card (V2_PLAN §10 binding spec):
 * - question card with the 3 verdict pills; answers go through
 *   submit_repair_verdict; waiting state until the partner answers
 * - server-gated mutual reveal with both answers + the one verdict line;
 *   "close" dismisses for good; "still tender" offers round two → Refocus
 * - 48h reflection transform saves a PRIVATE learning
 * - hidden when the flag is off or no check-in is due
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockTrack = jest.fn();
jest.mock('../../lib/analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  EVENTS: jest.requireActual('../../lib/analytics').EVENTS,
}));

const mockRpc = jest.fn();
const mockFlagRows = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'feature_flags') {
        return { select: () => mockFlagRows() };
      }
      if (table === 'refocus_sessions') {
        // useRefocusHistory (escalation-card gate) — empty history keeps
        // the console pristine and the escalation card off.
        const q = {
          select: () => q,
          eq: () => q,
          order: () => Promise.resolve({ data: [], error: null }),
        };
        return q;
      }
      throw new Error(`unexpected table ${table}`);
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { RepairCheckinCard } from './RepairCheckinCard';
import { __resetFlagsForTest } from '../../lib/flags';
import { REPAIR_COPY } from '../../content/repair';

const LIVE = {
  coupleId: 'couple-1',
  userId: 'user-1',
  partnerName: 'Dani',
  partnerInitial: 'D',
  myName: 'you',
  myInitial: 'Y',
};

const OPEN = {
  exists: true,
  id: 'ck-1',
  state: 'open',
  i_answered: false,
  partner_answered: false,
  my_verdict: null,
  their_verdict: null,
};

function mockCheckin(projection: unknown) {
  mockRpc.mockImplementation((fn: string) => {
    if (fn === 'ensure_repair_checkin') return Promise.resolve({ data: null, error: null });
    if (fn === 'get_repair_checkin') return Promise.resolve({ data: projection, error: null });
    return Promise.resolve({ data: null, error: null });
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetFlagsForTest();
  mockPush.mockReset();
  mockTrack.mockReset();
  mockRpc.mockReset();
  mockFlagRows
    .mockReset()
    .mockResolvedValue({ data: [{ key: 'f2_repair_checkin', enabled: true }], error: null });
});

describe('RepairCheckinCard', () => {
  it('renders the question with all three verdict pills', async () => {
    mockCheckin(OPEN);
    const { getByText, getByLabelText } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(getByText(REPAIR_COPY.title)).toBeTruthy());
    expect(getByLabelText('yes')).toBeTruthy();
    expect(getByLabelText('getting there')).toBeTruthy();
    expect(getByLabelText('still tender')).toBeTruthy();
  });

  it('renders nothing when the flag is off', async () => {
    mockFlagRows.mockResolvedValue({ data: [], error: null });
    mockCheckin(OPEN);
    const { queryByTestId } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(queryByTestId('repair-checkin-card')).toBeNull());
  });

  it('renders nothing when no check-in is due', async () => {
    mockCheckin({ exists: false });
    const { queryByTestId } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(queryByTestId('repair-checkin-card')).toBeNull());
  });

  it('submits my verdict and moves to the waiting state', async () => {
    mockCheckin(OPEN);
    const { getByLabelText, getByText } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(getByLabelText('yes')).toBeTruthy());

    mockCheckin({ ...OPEN, i_answered: true, my_verdict: 'yes' });
    await act(async () => {
      fireEvent.press(getByLabelText('yes'));
    });
    expect(mockRpc).toHaveBeenCalledWith('submit_repair_verdict', {
      p_checkin: 'ck-1',
      p_verdict: 'yes',
    });
    expect(getByText(REPAIR_COPY.waiting('Dani'))).toBeTruthy();
  });

  it('shows the mutual-repair reveal: both answers + the milestone line', async () => {
    mockCheckin({
      ...OPEN,
      state: 'revealed',
      i_answered: true,
      partner_answered: true,
      my_verdict: 'yes',
      their_verdict: 'yes',
    });
    const { getByText } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(getByText(`✨ ${REPAIR_COPY.repairLine}`)).toBeTruthy());
    expect(getByText(REPAIR_COPY.revealKick)).toBeTruthy();
  });

  it('"close" dismisses the reveal for good', async () => {
    mockCheckin({
      ...OPEN,
      state: 'revealed',
      my_verdict: 'yes',
      their_verdict: 'getting_there',
    });
    const { getByText, queryByTestId } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(getByText(REPAIR_COPY.dismiss)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(REPAIR_COPY.dismiss));
    });
    expect(queryByTestId('repair-checkin-card')).toBeNull();
    expect(await AsyncStorage.getItem('parallax:repair_reveal_seen')).toBe('ck-1');
  });

  it('a tender reveal offers round two → Refocus', async () => {
    mockCheckin({
      ...OPEN,
      state: 'revealed',
      my_verdict: 'still_tender',
      their_verdict: 'yes',
    });
    const { getByText } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(getByText(REPAIR_COPY.tenderLine)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(REPAIR_COPY.roundTwo));
    });
    expect(mockPush).toHaveBeenCalledWith('/refocus');
  });

  it('the 48h reflection saves a private learning and acks in place', async () => {
    mockCheckin({ ...OPEN, state: 'reflection', reflection_mine: true });
    const { getByText, getByPlaceholderText } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(getByText(REPAIR_COPY.reflectionPrompt)).toBeTruthy());

    await act(async () => {
      fireEvent.changeText(
        getByPlaceholderText('say it however it comes…'),
        'i need a beat before we talk'
      );
    });
    await act(async () => {
      fireEvent.press(getByText(REPAIR_COPY.reflectionSave));
    });
    expect(mockRpc).toHaveBeenCalledWith('add_private_learning', {
      p_couple: 'couple-1',
      p_learning_detail: 'i need a beat before we talk',
    });
    expect(getByText(REPAIR_COPY.reflectionSaved)).toBeTruthy();
  });

  it('never shows the reflection to the partner who ignored the check-in', async () => {
    mockCheckin({ ...OPEN, state: 'reflection', reflection_mine: false });
    const { queryByTestId } = await render(<RepairCheckinCard {...LIVE} />);
    await waitFor(() => expect(queryByTestId('repair-checkin-card')).toBeNull());
  });

  describe('funnel instrumentation (§7)', () => {
    it('tracks repair_verdict on submit', async () => {
      mockCheckin(OPEN);
      const { getByLabelText } = await render(<RepairCheckinCard {...LIVE} />);
      await waitFor(() => expect(getByLabelText('yes')).toBeTruthy());
      await act(async () => {
        fireEvent.press(getByLabelText('yes'));
      });
      expect(mockTrack).toHaveBeenCalledWith('repair_verdict', { verdict: 'yes' });
    });

    it('tracks repair_revealed with the outcome when the reveal lands', async () => {
      mockCheckin({
        ...OPEN,
        state: 'revealed',
        my_verdict: 'yes',
        their_verdict: 'yes',
      });
      const { getByText } = await render(<RepairCheckinCard {...LIVE} />);
      await waitFor(() => expect(getByText(REPAIR_COPY.revealKick)).toBeTruthy());
      expect(mockTrack).toHaveBeenCalledWith('repair_revealed', { outcome: 'repair' });
    });
  });
});

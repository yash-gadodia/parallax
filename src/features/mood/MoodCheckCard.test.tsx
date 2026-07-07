/**
 * V2 F1 mood-check card (V2_PLAN §10 binding spec):
 * - greeting card with 4 day-word pills when nothing happened today
 * - rough pick expands IN PLACE into the quiet offer (never a modal)
 * - "not now" collapses for the rest of the day; "let's talk" → Refocus tab
 * - hidden when the flag is off, on played days, and after a bright pick
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRpc = jest.fn();
const mockMaybeSingle = jest.fn();
const mockFlagRows = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'feature_flags') {
        return { select: () => mockFlagRows() };
      }
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: () => mockMaybeSingle(),
      };
      return q;
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { MoodCheckCard } from './MoodCheckCard';
import { __resetFlagsForTest } from '../../lib/flags';
import { MOOD_COPY } from '../../content/mood';

const LIVE = {
  coupleId: 'couple-1',
  userId: 'user-1',
  tz: 'Asia/Singapore',
  playedToday: false,
};

beforeEach(async () => {
  // the async-storage mock's store persists across tests — a dismissal from
  // one test must not leak into the next
  await AsyncStorage.clear();
  __resetFlagsForTest();
  mockPush.mockReset();
  mockRpc.mockReset().mockResolvedValue({ data: null, error: null });
  mockMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  mockFlagRows
    .mockReset()
    .mockResolvedValue({ data: [{ key: 'f1_mood_check', enabled: true }], error: null });
});

describe('MoodCheckCard', () => {
  it('renders the greeting with all 4 day-word pills when the flag is on', async () => {
    const { getByText, getByLabelText } = await render(<MoodCheckCard {...LIVE} />);
    await waitFor(() => expect(getByText(MOOD_COPY.kick)).toBeTruthy());
    expect(getByLabelText('golden')).toBeTruthy();
    expect(getByLabelText('good')).toBeTruthy();
    expect(getByLabelText('off')).toBeTruthy();
    expect(getByLabelText('heavy')).toBeTruthy();
  });

  it('renders nothing when the flag is off', async () => {
    mockFlagRows.mockResolvedValue({ data: [], error: null });
    const { queryByTestId } = await render(<MoodCheckCard {...LIVE} />);
    await waitFor(() => expect(queryByTestId('mood-check-card')).toBeNull());
  });

  it('renders nothing on a day the couple already played', async () => {
    const { queryByTestId } = await render(
      <MoodCheckCard {...LIVE} playedToday />
    );
    await waitFor(() => expect(queryByTestId('mood-check-card')).toBeNull());
  });

  it('submits a bright pick via submit_mood_check and shows the ack, no offer', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <MoodCheckCard {...LIVE} />
    );
    await waitFor(() => expect(getByLabelText('good')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByLabelText('good'));
    });
    expect(mockRpc).toHaveBeenCalledWith('submit_mood_check', {
      p_couple: 'couple-1',
      p_mood: 'good',
    });
    expect(getByText(MOOD_COPY.ack)).toBeTruthy();
    expect(queryByText(MOOD_COPY.offerLine)).toBeNull();
  });

  it('expands in place with the quiet offer on a rough pick', async () => {
    const { getByLabelText, getByText } = await render(<MoodCheckCard {...LIVE} />);
    await waitFor(() => expect(getByLabelText('heavy')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByLabelText('heavy'));
    });
    expect(mockRpc).toHaveBeenCalledWith('submit_mood_check', {
      p_couple: 'couple-1',
      p_mood: 'heavy',
    });
    expect(getByText(MOOD_COPY.offerLine)).toBeTruthy();
    expect(getByText(MOOD_COPY.offerTalk)).toBeTruthy();
    expect(getByText(MOOD_COPY.offerDismiss)).toBeTruthy();
  });

  it('"let\'s talk" routes to the Refocus tab', async () => {
    const { getByLabelText, getByText } = await render(<MoodCheckCard {...LIVE} />);
    await waitFor(() => expect(getByLabelText('off')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByLabelText('off'));
    });
    await act(async () => {
      fireEvent.press(getByText(MOOD_COPY.offerTalk));
    });
    expect(mockPush).toHaveBeenCalledWith('/refocus');
  });

  it('"not now" collapses the card for the rest of the day', async () => {
    const { getByLabelText, getByText, queryByTestId } = await render(
      <MoodCheckCard {...LIVE} />
    );
    await waitFor(() => expect(getByLabelText('off')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByLabelText('off'));
    });
    await act(async () => {
      fireEvent.press(getByText(MOOD_COPY.offerDismiss));
    });
    expect(queryByTestId('mood-check-card')).toBeNull();
  });

  it('reverts the pick and keeps the greeting when the submit fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'offline' } });
    const { getByLabelText, getByText, queryByText } = await render(
      <MoodCheckCard {...LIVE} />
    );
    await waitFor(() => expect(getByLabelText('heavy')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByLabelText('heavy'));
    });
    expect(queryByText(MOOD_COPY.offerLine)).toBeNull();
    expect(getByText(MOOD_COPY.kick)).toBeTruthy();
  });

  it('shows the pending offer on remount when today\'s mood is rough and undismissed', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { mood: 'heavy' }, error: null });
    const { getByText } = await render(<MoodCheckCard {...LIVE} />);
    await waitFor(() => expect(getByText(MOOD_COPY.offerLine)).toBeTruthy());
  });

  it('renders nothing on remount after a bright mood was recorded', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { mood: 'golden' }, error: null });
    const { queryByTestId } = await render(<MoodCheckCard {...LIVE} />);
    await waitFor(() => expect(queryByTestId('mood-check-card')).toBeNull());
  });
});

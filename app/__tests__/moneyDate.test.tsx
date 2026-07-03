import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import MoneyDateScreen from '../moneyDate';
import { useMoneyDate } from '../../src/features/moneyDates/useMoneyDate';
import {
  startMoneyDate,
  advanceMoneyDate,
  completeMoneyDate,
} from '../../src/features/moneyDates/moneyDateActions';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn(), navigate: jest.fn() }),
}));

jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(() => ({
    me: { name: 'Alex', initial: 'A' },
    partner: { name: 'Jordan', initial: 'J', hasPartner: true },
    loading: false,
  })),
}));

jest.mock('../../src/features/moneyDates/useMoneyDate', () => ({
  useMoneyDate: jest.fn(),
}));

jest.mock('../../src/features/moneyDates/moneyDateActions', () => ({
  startMoneyDate: jest.fn(),
  advanceMoneyDate: jest.fn(),
  completeMoneyDate: jest.fn(),
}));

const mockUseMoneyDate = useMoneyDate as jest.Mock;
const mockStart = startMoneyDate as jest.Mock;
const mockAdvance = advanceMoneyDate as jest.Mock;
const mockComplete = completeMoneyDate as jest.Mock;

const DEMO = {
  state: null,
  coupleId: null,
  loading: false,
  isSample: true,
  error: null,
  refetch: jest.fn(),
};

const REAL = {
  state: {
    open: null,
    last_completed_at: null,
    last_agreed_action: null,
    sessions_completed: 0,
  },
  coupleId: 'couple-1',
  loading: false,
  isSample: false,
  error: null,
  refetch: jest.fn(),
};

describe('MoneyDateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyDate.mockReturnValue(DEMO);
  });

  it('frames the intro as together-on-one-phone with no numbers', async () => {
    const { getAllByText, getByText } = await render(<MoneyDateScreen />);
    // Appears twice by design: the TopBar title and the intro heading.
    expect(getAllByText('money date')).toHaveLength(2);
    expect(
      getByText(
        'grab Jordan — one phone, five minutes, zero numbers. four little cards to talk through, then you pick one tiny thing to try.'
      )
    ).toBeTruthy();
    expect(getByText('not budgeting. not advice. just the two of you, talking.')).toBeTruthy();
  });

  it('announces demo mode when unauthenticated', async () => {
    const { getByText } = await render(<MoneyDateScreen />);
    expect(getByText('demo · nothing is saved')).toBeTruthy();
  });

  it('walks the demo through all four cards to the agreed-action step, locally', async () => {
    const { getByText } = await render(<MoneyDateScreen />);

    await act(async () => {
      fireEvent.press(getByText("we're both here →"));
    });
    expect(getByText('what did money feel like in the home you grew up in?')).toBeTruthy();
    expect(getByText('1/4')).toBeTruthy();

    for (const next of ['next card →', 'next card →', 'next card →']) {
      await act(async () => {
        fireEvent.press(getByText(next));
      });
    }
    expect(getByText('if we changed one small money thing next month, what would make life feel lighter?')).toBeTruthy();
    expect(getByText('4/4')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('last bit: pick your tiny thing →'));
    });
    expect(getByText("one tiny thing you'll both try")).toBeTruthy();
    // No RPCs in demo mode — nothing is silently faked as saved.
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('requires the agreed action before it can be locked in, then celebrates it', async () => {
    const { getByText, getByLabelText } = await render(<MoneyDateScreen />);

    await act(async () => {
      fireEvent.press(getByText("we're both here →"));
    });
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        fireEvent.press(getByText(i < 3 ? 'next card →' : 'last bit: pick your tiny thing →'));
      });
    }

    // Empty action: the button is a no-op.
    await act(async () => {
      fireEvent.press(getByText('lock it in ✨'));
    });
    expect(getByText("one tiny thing you'll both try")).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(getByLabelText('Your one tiny agreed action'), '  cook in on fridays  ');
    });
    await act(async () => {
      fireEvent.press(getByText('lock it in ✨'));
    });
    expect(getByText("that's a money date")).toBeTruthy();
    expect(getByText('cook in on fridays')).toBeTruthy();
    expect(getByText('this was the demo — pair up and it saves to your story.')).toBeTruthy();
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('starts a real session through the RPC and records card notes on advance', async () => {
    mockUseMoneyDate.mockReturnValue(REAL);
    mockStart.mockResolvedValue('session-1');
    mockAdvance.mockResolvedValue(1);

    const { getByText, getByLabelText } = await render(<MoneyDateScreen />);
    await act(async () => {
      fireEvent.press(getByText("we're both here →"));
    });
    expect(mockStart).toHaveBeenCalledWith('couple-1');
    expect(getByText('what did money feel like in the home you grew up in?')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(
        getByLabelText('Keep a line from this card (optional)'),
        'cash under the mattress'
      );
    });
    await act(async () => {
      fireEvent.press(getByText('next card →'));
    });
    expect(mockAdvance).toHaveBeenCalledWith('session-1', 'cash under the mattress');
    expect(getByText('2/4')).toBeTruthy();
  });

  it('resumes a fresh open session on its card', async () => {
    mockUseMoneyDate.mockReturnValue({
      ...REAL,
      state: {
        ...REAL.state,
        open: { id: 'session-1', step: 2, started_by: 'user-1' },
      },
    });
    mockStart.mockResolvedValue('session-1');

    const { getByText } = await render(<MoneyDateScreen />);
    await act(async () => {
      fireEvent.press(getByText('pick up where you left off →'));
    });
    expect(getByText('3/4')).toBeTruthy();
    expect(
      getByText('a little windfall lands tomorrow. what do you each blow it on, zero guilt?')
    ).toBeTruthy();
  });

  it('keeps the note and shows an honest error when an advance fails', async () => {
    mockUseMoneyDate.mockReturnValue(REAL);
    mockStart.mockResolvedValue('session-1');
    mockAdvance.mockRejectedValue(new Error('network down'));

    const { getByText, getByLabelText, getByDisplayValue } = await render(<MoneyDateScreen />);
    await act(async () => {
      fireEvent.press(getByText("we're both here →"));
    });
    await act(async () => {
      fireEvent.changeText(getByLabelText('Keep a line from this card (optional)'), 'my note');
    });
    await act(async () => {
      fireEvent.press(getByText('next card →'));
    });

    expect(getByText("that card didn't save — try again.")).toBeTruthy();
    expect(getByText('1/4')).toBeTruthy();
    expect(getByDisplayValue('my note')).toBeTruthy();
  });

  it('shows the honest retryable state when a real fetch fails', async () => {
    const refetch = jest.fn();
    mockUseMoneyDate.mockReturnValue({
      ...REAL,
      state: null,
      error: new Error('network down'),
      refetch,
    });
    const { getByText } = await render(<MoneyDateScreen />);
    expect(getByText("couldn't load your money date")).toBeTruthy();

    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

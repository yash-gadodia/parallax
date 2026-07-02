import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UsScreen from '../us';
import { useCoupleHistory } from '../../../src/features/lovemap/useCoupleHistory';

jest.mock('../../../src/features/lovemap/useLearnings', () => ({
  useLearnings: jest.fn(() => ({
    items: [],
    isSample: true,
  })),
}));

jest.mock('../../../src/features/lovemap/useCoupleHistory', () => ({
  useCoupleHistory: jest.fn(),
}));

jest.mock('../../../src/features/history/useDropEmojis', () => ({
  useDropEmojis: jest.fn(() => ({})),
}));

jest.mock('../../../src/features/profile/useProfile', () => ({
  useProfile: jest.fn(() => ({
    name: 'Alex',
    partnerName: 'Jordan',
    spiceLevel: 'Spicy',
    notifyTime: null,
    togetherSince: 'March 2023',
    streak: 7,
    loading: false,
    updateProfile: jest.fn(),
  })),
}));

const mockUseCoupleHistory = useCoupleHistory as jest.Mock;
const { useDropEmojis } = require('../../../src/features/history/useDropEmojis');
const mockUseDropEmojis = useDropEmojis as jest.Mock;

// Real history so the wavelength chart + stat trio render (empty history
// shows the first-run state instead). history[0] is the latest drop.
const THREE_DROPS = [
  { date: '2026-06-30', code: 'TODAY', title: 'soft launch', wavelength: 82, twins_count: 2 },
  { date: '2026-06-29', code: 'DROP 26', title: 'the ick list', wavelength: 74, twins_count: 1 },
  { date: '2026-06-28', code: 'DROP 25', title: 'future tense', wavelength: 88, twins_count: 3 },
];

describe('UsScreen', () => {
  beforeEach(() => {
    mockUseCoupleHistory.mockReturnValue({
      history: THREE_DROPS,
      isSample: false,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseDropEmojis.mockReturnValue({});
  });

  it('shows the history skeleton (chart, stat trio, rows) while history loads', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [],
      isSample: false,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });
    const { getByTestId, getAllByTestId, queryByText } = await render(<UsScreen />);

    expect(getByTestId('us-skeleton-chart')).toBeTruthy();
    expect(getAllByTestId('us-skeleton-stat')).toHaveLength(3);
    expect(getAllByTestId('us-skeleton-row')).toHaveLength(2);
    // Neither the empty state nor the chart pops in while loading.
    expect(queryByText('YOUR STORY STARTS HERE')).toBeNull();
    expect(queryByText('LAST 7 DROPS')).toBeNull();
    expect(queryByText('your drop history')).toBeNull();
  });

  it('shows the warm retryable error state when the history fetch fails', async () => {
    const refetch = jest.fn();
    mockUseCoupleHistory.mockReturnValue({
      history: [],
      isSample: false,
      loading: false,
      error: new Error('network down'),
      refetch,
    });
    const { getByText, queryByText } = await render(<UsScreen />);

    expect(getByText("hmm, that didn't load")).toBeTruthy();
    expect(
      getByText("your story with Jordan is safe — we just couldn't reach it.")
    ).toBeTruthy();
    expect(queryByText('YOUR STORY STARTS HERE')).toBeNull();

    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('hides the drop-history label when a real couple has no history yet', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [],
      isSample: false,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    const { getByText, queryByText } = await render(<UsScreen />);

    expect(getByText('Your wavelength with Jordan shows up after your first reveal.')).toBeTruthy();
    expect(queryByText('your drop history')).toBeNull();
  });

  it('renders real couple name from useProfile', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('Alex & Jordan')).toBeTruthy();
  });

  it('renders real streak count from useProfile', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('together since march · 7 day streak 🔥')).toBeTruthy();
  });

  it('renders the love map card title', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('Your Love Map')).toBeTruthy();
  });

  it('renders the wavelength section', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('LAST 7 DROPS')).toBeTruthy();
  });

  it('renders a stat card', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('answered')).toBeTruthy();
  });

  it('renders the drop history label', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('your drop history')).toBeTruthy();
  });

  it('computes the trend delta from the two latest drops (82 vs 74 → ▲ 8%)', async () => {
    const { getByText } = await render(<UsScreen />);
    expect(getByText('▲ 8%')).toBeTruthy();
  });

  it('shows a downward trend when the latest drop scored lower (70 vs 76 → ▼ 6%)', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [
        { date: '2026-06-30', code: 'TODAY', title: 'soft launch', wavelength: 70, twins_count: 1 },
        { date: '2026-06-29', code: 'DROP 26', title: 'the ick list', wavelength: 76, twins_count: 2 },
      ],
      isSample: false,
    });
    const { getByText } = await render(<UsScreen />);
    expect(getByText('▼ 6%')).toBeTruthy();
  });

  it('hides the trend delta with a single drop of history', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [
        { date: '2026-06-30', code: 'TODAY', title: 'soft launch', wavelength: 82, twins_count: 2 },
      ],
      isSample: false,
    });
    const { getByText, queryByText } = await render(<UsScreen />);
    expect(getByText('LAST 7 DROPS')).toBeTruthy();
    expect(queryByText(/^[▲▼]/)).toBeNull();
  });

  it('renders the real drop emoji, title, code and wave for a real history row', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [
        { date: '2026-07-01', code: 'W12', title: 'the hot seat', wavelength: 64, twins_count: 1 },
      ],
      isSample: false,
    });
    mockUseDropEmojis.mockReturnValue({ W12: '🧨' });

    const { getByText, getAllByText } = await render(<UsScreen />);

    expect(getByText('🧨')).toBeTruthy();
    expect(getByText('the hot seat')).toBeTruthy();
    expect(getByText('W12 · 2026-07-01')).toBeTruthy();
    // Wavelength headline + history row, each doubled by GradientText's
    // masked + invisible-sizer copies.
    expect(getAllByText('64%')).toHaveLength(4);
  });

  it('falls back to 💬 for a real drop with no known emoji (never the demo ARCHIVE art)', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [
        { date: '2026-07-01', code: 'W99', title: 'unknown drop', wavelength: 50, twins_count: 0 },
      ],
      isSample: false,
    });

    const { getByText, queryByText } = await render(<UsScreen />);

    expect(getByText('💬')).toBeTruthy();
    expect(queryByText('😬')).toBeNull();
  });

  it('still shows the demo ARCHIVE emoji for the sample history', async () => {
    const { getByText } = await render(<UsScreen />);

    // 'DROP 26' (the ick list) carries 😬 in the static ARCHIVE.
    expect(getByText('😬')).toBeTruthy();
  });

  it('hides the trend delta when the two latest drops tie', async () => {
    mockUseCoupleHistory.mockReturnValue({
      history: [
        { date: '2026-06-30', code: 'TODAY', title: 'soft launch', wavelength: 80, twins_count: 2 },
        { date: '2026-06-29', code: 'DROP 26', title: 'the ick list', wavelength: 80, twins_count: 1 },
      ],
      isSample: false,
    });
    const { queryByText } = await render(<UsScreen />);
    expect(queryByText(/^[▲▼]/)).toBeNull();
  });
});

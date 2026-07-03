import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import TimelineScreen from '../timeline';
import type { TimelineEntry } from '../../src/features/history/timeline';

jest.mock('../../src/lib/nav', () => ({ safeBack: jest.fn() }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), navigate: jest.fn() }),
}));

const mockUseTimeline = jest.fn();
jest.mock('../../src/features/history/useTimeline', () => ({
  useTimeline: () => mockUseTimeline(),
}));

jest.mock('../../src/features/history/useDropEmojis', () => ({
  useDropEmojis: jest.fn(() => ({})),
}));

jest.mock('../../src/features/profile/useProfile', () => ({
  useProfile: jest.fn(() => ({ partnerName: 'Jordan' })),
}));

const FEED: TimelineEntry[] = [
  { kind: 'month', id: 'month-2026-07', ym: '2026-07', label: 'JULY 2026' },
  {
    kind: 'drop',
    id: 'drop-cd-27',
    date: '2026-07-02',
    code: 'DROP 27',
    title: 'the ick list',
    wavelength: 88,
    twins_count: 2,
    couple_drop_id: 'cd-27',
    twin: true,
  },
  { kind: 'milestone', id: 'milestone-m1', date: '2026-07-01', days: 7 },
  { kind: 'month', id: 'month-2026-06', ym: '2026-06', label: 'JUNE 2026' },
  {
    kind: 'drop',
    id: 'drop-cd-26',
    date: '2026-06-30',
    code: 'DROP 26',
    title: 'future tense',
    wavelength: 74,
    twins_count: 1,
    couple_drop_id: 'cd-26',
    twin: false,
  },
  { kind: 'pairup', id: 'pairup', date: '2026-06-15', label: 'Yash & Dani paired up' },
];

describe('TimelineScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeline.mockReturnValue({
      entries: FEED,
      loading: false,
      isSample: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders the whole story: month headers, drop, milestone and pair-up rows', async () => {
    const { getByText, getAllByText } = await render(<TimelineScreen />);

    expect(getByText('your story')).toBeTruthy();
    expect(getByText('JULY 2026')).toBeTruthy();
    expect(getByText('JUNE 2026')).toBeTruthy();

    // A revealed drop row (title + code/day).
    expect(getByText('the ick list')).toBeTruthy();
    expect(getByText('DROP 27 · july 2')).toBeTruthy();
    // GradientText renders its string twice (mask + sizer copy).
    expect(getAllByText('88%')).toHaveLength(2);

    // The twin-moment day earns its 👯 treatment; the non-twin drop does not.
    expect(getByText('👯 twin day')).toBeTruthy();

    // A streak milestone entry.
    expect(getByText('7-day streak')).toBeTruthy();

    // The pair-up entry: the couple's start.
    expect(getByText('Yash & Dani paired up')).toBeTruthy();

    expect(getByText("that's your whole story · just you two")).toBeTruthy();
  });

  it('routes a real drop row to its detail with the couple_drop id', async () => {
    const { getByText } = await render(<TimelineScreen />);

    fireEvent.press(getByText('the ick list'));
    expect(mockPush).toHaveBeenCalledWith(
      '/dropDetail?code=DROP 27&cdid=cd-27&day=2026-07-02'
    );
  });

  it('routes a milestone row to the streak screen', async () => {
    const { getByText } = await render(<TimelineScreen />);

    fireEvent.press(getByText('7-day streak'));
    expect(mockPush).toHaveBeenCalledWith('/streak');
  });

  it('shows skeleton rows (not the empty state) while the story loads', async () => {
    mockUseTimeline.mockReturnValue({
      entries: [],
      loading: true,
      isSample: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getAllByTestId, queryByText } = await render(<TimelineScreen />);

    expect(getAllByTestId('timeline-skeleton-row')).toHaveLength(3);
    expect(queryByText("your story starts with tonight's drop")).toBeNull();
  });

  it('shows the warm empty state when there is no story yet', async () => {
    mockUseTimeline.mockReturnValue({
      entries: [],
      loading: false,
      isSample: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, queryByText } = await render(<TimelineScreen />);

    expect(getByText("your story starts with tonight's drop")).toBeTruthy();
    expect(
      getByText(
        'every reveal, streak and twin moment you and Jordan unlock lands here — a story only you two are writing.'
      )
    ).toBeTruthy();
    expect(queryByText('JULY 2026')).toBeNull();
  });

  it('shows an honest retryable error and calls refetch on press', async () => {
    const refetch = jest.fn();
    mockUseTimeline.mockReturnValue({
      entries: [],
      loading: false,
      isSample: false,
      error: new Error('offline'),
      refetch,
    });

    const { getByText, queryByText } = await render(<TimelineScreen />);

    expect(getByText("hmm, that didn't load")).toBeTruthy();
    expect(
      getByText("your story with Jordan is safe — we just couldn't reach it.")
    ).toBeTruthy();
    expect(queryByText("your story starts with tonight's drop")).toBeNull();

    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('demo (isSample): routes a sample drop by code only (no cdid), never a live id', async () => {
    mockUseTimeline.mockReturnValue({
      entries: [
        { kind: 'month', id: 'month-2026-07', ym: '2026-07', label: 'JULY 2026' },
        {
          kind: 'drop',
          id: 'drop-DROP 26-2026-07-03',
          date: '2026-07-03',
          code: 'DROP 26',
          title: 'the ick list',
          wavelength: 88,
          twins_count: 2,
          couple_drop_id: '',
          twin: true,
        },
        { kind: 'pairup', id: 'pairup', date: '2024-02-01', label: 'Yash & Dani paired up' },
      ] as TimelineEntry[],
      loading: false,
      isSample: true,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = await render(<TimelineScreen />);

    // The demo ARCHIVE emoji resolves for 'DROP 26'.
    expect(getByText('😬')).toBeTruthy();

    fireEvent.press(getByText('the ick list'));
    expect(mockPush).toHaveBeenCalledWith('/dropDetail?code=DROP 26');
  });
});

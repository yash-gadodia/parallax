import React from 'react';
import { render, act } from '@testing-library/react-native';

let mockParams: { code?: string; cdid?: string; day?: string } = {};

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockGetDropContent = jest.fn();
const mockFetchReveal = jest.fn();
jest.mock('../../src/features/drops/dropActions', () => ({
  getDropContent: (...a: unknown[]) => mockGetDropContent(...a),
  fetchReveal: (...a: unknown[]) => mockFetchReveal(...a),
}));

import DropDetailScreen from '../dropDetail';

describe('DropDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('renders the REAL drop from the server when cdid is present (0.4)', async () => {
    mockParams = { code: 'W12', cdid: 'cd-real-1', day: '2026-06-30' };
    mockGetDropContent.mockResolvedValue({
      code: 'W12',
      title: 'the deep end',
      prompts: [
        { id: 'p1', emoji: '🌊', q: 'comfort rewatch?', opts: ['the office', 'ghibli', 'f1'] },
      ],
    });
    mockFetchReveal.mockResolvedValue({
      state: 'revealed',
      reveal: { yourHits: 1, theirHits: 0, twins: 1, wave: 80 },
      promptAnswers: [{ youPick: 1, youHunch: 1, themPick: 1, themHunch: 0 }],
      prompts: [],
      caughtUp: true,
    });

    const { getByText, getAllByText, queryByText } = await render(<DropDetailScreen />);
    await act(async () => {});

    expect(mockGetDropContent).toHaveBeenCalledWith('cd-real-1');
    expect(mockFetchReveal).toHaveBeenCalledWith('cd-real-1');
    // Real title + question + the STORED 80% — not any ARCHIVE stand-in.
    expect(getByText('the deep end')).toBeTruthy();
    expect(getByText('comfort rewatch?')).toBeTruthy();
    expect(getAllByText('80%').length).toBeGreaterThan(0);
    expect(getAllByText('ghibli').length).toBe(2); // both partners picked it
    expect(queryByText("This drop isn't available yet")).toBeNull();
  });

  it('holds quietly while the real drop loads — never demo content', async () => {
    mockParams = { code: 'W12', cdid: 'cd-real-2' };
    mockGetDropContent.mockReturnValue(new Promise(() => {}));
    mockFetchReveal.mockReturnValue(new Promise(() => {}));

    const { getByText, queryByText } = await render(<DropDetailScreen />);

    expect(getByText('opening this drop…')).toBeTruthy();
    expect(queryByText("This drop isn't available yet")).toBeNull();
  });

  it('renders the requested archive drop with questions and labels', async () => {
    mockParams = { code: 'DROP 26' };
    const { getByText, getAllByText } = await render(<DropDetailScreen />);

    // Should render the drop code in TopBar
    expect(getByText('DROP 26')).toBeTruthy();

    // Should render a question from that drop
    expect(getByText('Biggest ick?')).toBeTruthy();

    // Should render column labels (multiple instances of "you" exist, so getAllByText)
    const youLabels = getAllByText('you');
    expect(youLabels.length).toBeGreaterThan(0);

    const daniLabels = getAllByText('Dani');
    expect(daniLabels.length).toBeGreaterThan(0);
  });

  it('shows the honest empty state for a code not in the archive, never another drop', async () => {
    mockParams = { code: 'DROP 99' };
    const { getByText, queryByText } = await render(<DropDetailScreen />);

    expect(getByText('DROP 99')).toBeTruthy();
    expect(getByText("This drop isn't available yet")).toBeTruthy();
    expect(getByText('The full look-back at your answers is coming soon.')).toBeTruthy();
    expect(queryByText('Biggest ick?')).toBeNull();
    expect(queryByText('DROP 26')).toBeNull();
  });

  it('shows the empty state when no code is given instead of a stand-in drop', async () => {
    const { getByText, queryByText } = await render(<DropDetailScreen />);

    expect(getByText('drop')).toBeTruthy();
    expect(getByText("This drop isn't available yet")).toBeTruthy();
    expect(queryByText('DROP 26')).toBeNull();
  });
});

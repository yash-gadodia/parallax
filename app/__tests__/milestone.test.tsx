import React from 'react';
import { render, act } from '@testing-library/react-native';

// Param-controlled router mock (the global expo-router mock returns {} params).
let mockDays: string | undefined;
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
  useLocalSearchParams: () => (mockDays !== undefined ? { days: mockDays } : {}),
}));

jest.mock('../../src/lib/haptics', () => ({
  selection: jest.fn(() => Promise.resolve()),
  lightTick: jest.fn(() => Promise.resolve()),
  success: jest.fn(() => Promise.resolve()),
  celebration: jest.fn(() => Promise.resolve()),
}));

import MilestoneScreen from '../milestone';
import * as haptics from '../../src/lib/haptics';

describe('MilestoneScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDays = undefined;
  });

  it('renders the milestone heading and cta buttons', async () => {
    const { getByText } = await render(<MilestoneScreen />);

    // Assert the days counter subheader is rendered
    expect(getByText('days in a row, together')).toBeTruthy();

    // Assert the Share button is rendered
    expect(getByText('Share our milestone')).toBeTruthy();

    // Assert the Keep going button is rendered
    expect(getByText('Keep it going')).toBeTruthy();
  });

  it('fires the celebration haptic once on mount', async () => {
    await render(<MilestoneScreen />);
    await act(async () => {});
    expect(haptics.celebration).toHaveBeenCalledTimes(1);
  });

  it('renders the one-shot sparkle burst (12 particles over 5 emojis)', async () => {
    const { getAllByText } = await render(<MilestoneScreen />);
    await act(async () => {});
    // 12 particles cycling 🔥✨💞🎉💗 -> 🔥 appears 3x as particles + 1x as the big flame
    expect(getAllByText('🔥')).toHaveLength(4);
    expect(getAllByText('✨')).toHaveLength(3);
    expect(getAllByText('💗')).toHaveLength(2);
  });

  // Real milestone thresholds from migration 0017: 3/7/14/30/50/100.
  const CASES: Array<[string, string, string]> = [
    ['3', 'Three days in.\nThis is becoming a thing.', 'Three days in a row. Every ritual starts exactly like this.'],
    ['7', 'One week strong.', 'Seven days in a row. This is how rituals are born.'],
    ['14', 'Two weeks,\nzero blinks.', 'Fourteen days without missing once. You two mean it.'],
    ['30', "You're officially\na streak couple.", "A whole month of showing up for each other. That's rarer than you think."],
    ['50', 'Fifty days of\nshowing up together.', "Fifty days straight. You've made this a habit, together."],
    ['100', 'A hundred days of\nshowing up.', 'A hundred days of showing up. Rarer than it sounds.'],
  ];

  it.each(CASES)('renders honest copy and the day count for the %s-day milestone', async (days, line, sub) => {
    mockDays = days;
    const { getByText } = await render(<MilestoneScreen />);
    expect(getByText(days)).toBeTruthy();
    expect(getByText(line)).toBeTruthy();
    expect(getByText(sub)).toBeTruthy();
  });

  it('falls back to the SMALLEST milestone when the days param is missing — never fabricates a bigger streak', async () => {
    mockDays = undefined;
    const { getByText, queryByText } = await render(<MilestoneScreen />);
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Three days in.\nThis is becoming a thing.')).toBeTruthy();
    expect(queryByText("You're officially\na streak couple.")).toBeNull();
  });
});

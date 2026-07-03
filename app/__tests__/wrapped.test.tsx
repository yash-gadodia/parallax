import React from 'react';
import { Animated } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import WrappedScreen from '../wrapped';
import { monthLabel, monthName, monthShort } from '../../src/features/history/historyStats';

jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../src/features/lovemap/useCoupleHistory', () => ({
  useCoupleHistory: jest.fn(),
}));

const { useIdentity } = require('../../src/features/profile/useIdentity');
const { useCouple } = require('../../src/features/pairing/useCouple');
const { useCoupleHistory } = require('../../src/features/lovemap/useCoupleHistory');

const now = new Date();
const month = monthLabel(now);
const year = now.getFullYear();
const yy = String(year).slice(-2);
const iso = (d: Date, day: number) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// 12 revealed drops in the current month; waves sum to 996 -> average exactly 83.
// Best day is the unique 95 ("the deep end") on day 12.
const WAVES = [95, 90, 88, 85, 85, 84, 82, 80, 78, 76, 77, 76];
const TWELVE_THIS_MONTH = WAVES.map((wavelength, i) => ({
  date: iso(now, 12 - i),
  code: `W${12 - i}`,
  title: i === 0 ? 'the deep end' : `drop ${12 - i}`,
  wavelength,
  twins_count: 1,
}));

function mockData({
  history = TWELVE_THIS_MONTH,
  streak = 9,
  loading = false,
  error = null as Error | null,
  refetch = jest.fn(),
}: {
  history?: typeof TWELVE_THIS_MONTH;
  streak?: number;
  loading?: boolean;
  error?: Error | null;
  refetch?: jest.Mock;
} = {}) {
  useCouple.mockReturnValue({
    couple: { id: 'c-1', streak, status: 'active' },
    loading: false,
    status: 'active',
  });
  useCoupleHistory.mockReturnValue({ history, loading, isSample: false, error, refetch });
}

// The progress bar starts an Animated.timing on every slide mount; its frame
// ticks land outside act() and corrupt subsequent renders in jest. Neutralise
// the animation driver — the slide CONTENT is what these tests assert.
beforeAll(() => {
  jest
    .spyOn(Animated, 'timing')
    .mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() } as unknown as ReturnType<
      typeof Animated.timing
    >);
});
afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
  useIdentity.mockReturnValue({
    me: { name: 'Alex', initial: 'A' },
    partner: { name: 'Jordan', initial: 'J', hasPartner: true },
    loading: false,
  });
  mockData();
});


describe('WrappedScreen', () => {
  it('renders the cover slide with the real month and couple names', async () => {
    const { getByText } = await render(<WrappedScreen />);

    expect(getByText(`parallax · ${month}`)).toBeTruthy();
    expect(getByText(/Your month/)).toBeTruthy();
    expect(getByText('Alex & Jordan · tap to begin →')).toBeTruthy();
  });

  it('walks through slides computed only from the real month history', async () => {
    const user = userEvent.setup();
    const { getByText, getByLabelText, queryByText } = await render(<WrappedScreen />);
    const next = () => user.press(getByLabelText('Next slide'));

    // Slide 2: drops played this month.
    await next();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('drops, together')).toBeTruthy();
    expect(getByText("that's 12 drops revealed this month.")).toBeTruthy();

    // Slide 3: real average wavelength (996 / 12 = 83).
    await next();
    expect(getByText('83%')).toBeTruthy();
    expect(getByText('average wavelength')).toBeTruthy();

    // Slide 4: best day.
    await next();
    expect(getByText('95%')).toBeTruthy();
    expect(getByText('the deep end')).toBeTruthy();
    expect(getByText(`${month} 12 — your highest wavelength this month.`)).toBeTruthy();

    // Slide 5: current streak from the couple row.
    await next();
    expect(getByText('9')).toBeTruthy();
    expect(getByText('day streak')).toBeTruthy();

    // Slide 6: share slide with the real average and spoiler-free dots.
    await next();
    expect(getByText('ALEX & JORDAN · 83% IN SYNC')).toBeTruthy();
    expect(getByText('🟢🟢🟢🟢🟢🟢🟢')).toBeTruthy();
    expect(getByText('Share our Wrapped')).toBeTruthy();

    // The canned archetype and numbers are gone for good.
    expect(queryByText('The Slow Burn')).toBeNull();
    expect(queryByText('your couple type')).toBeNull();
    expect(queryByText('28')).toBeNull();
    expect(queryByText('38')).toBeNull();
  });

  it('skips the streak slide when the streak is 0', async () => {
    mockData({ streak: 0 });
    const user = userEvent.setup();
    const { getByText, getByLabelText, queryByText } = await render(<WrappedScreen />);
    const next = () => user.press(getByLabelText('Next slide'));

    await next(); // drops
    await next(); // average
    await next(); // best day
    await next(); // -> share (no streak slide)
    expect(getByText('ALEX & JORDAN · 83% IN SYNC')).toBeTruthy();
    expect(queryByText('day streak')).toBeNull();
  });

  it('shows the warm not-yet state with fewer than 5 revealed drops this month', async () => {
    mockData({ history: TWELVE_THIS_MONTH.slice(0, 4) });
    const { getByText, queryByText } = await render(<WrappedScreen />);

    expect(getByText('your first month is still writing itself')).toBeTruthy();
    expect(getByText('back to today')).toBeTruthy();
    expect(queryByText(/Your month/)).toBeNull();
    expect(queryByText(`parallax · ${month}`)).toBeNull();
  });

  it('holds on the loading state while history loads — no premature not-yet copy', async () => {
    mockData({ history: [], loading: true });
    const { getByText, queryByText } = await render(<WrappedScreen />);

    expect(getByText('pulling your month together…')).toBeTruthy();
    expect(queryByText('your first month is still writing itself')).toBeNull();
    expect(queryByText(/Your month/)).toBeNull();
  });

  it('shows the honest retryable error state when history fails to load', async () => {
    const refetch = jest.fn();
    mockData({ history: [], error: new Error('offline'), refetch });
    const user = userEvent.setup();
    const { getByText, queryByText } = await render(<WrappedScreen />);

    expect(getByText("hmm, that didn't load")).toBeTruthy();
    expect(getByText("your month with Jordan is safe — we just couldn't reach it.")).toBeTruthy();
    // Never the "play more drops" copy when the story simply didn't load.
    expect(queryByText('your first month is still writing itself')).toBeNull();

    await user.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('flips to the annual Wavelength Wrapped and walks slides computed from the real year', async () => {
    const user = userEvent.setup();
    const { getByText, getByLabelText } = await render(<WrappedScreen />);
    const next = () => user.press(getByLabelText('Next slide'));

    await user.press(getByText('rewind the whole year →'));

    // Annual cover with the real year.
    expect(getByText(`parallax · ${year}`)).toBeTruthy();
    expect(getByText(new RegExp(`Wavelength\\s+Wrapped '${yy}`))).toBeTruthy();

    // Drops played across the year.
    await next();
    expect(getByText('12')).toBeTruthy();
    expect(getByText(`that's 12 drops revealed in ${year}.`)).toBeTruthy();

    // Real annual average (996 / 12 = 83).
    await next();
    expect(getByText('83%')).toBeTruthy();
    expect(getByText('your real average, across every reveal this year.')).toBeTruthy();

    // Only one month played -> no curve slide; straight to the most telepathic month.
    await next();
    expect(getByText(month)).toBeTruthy();
    expect(getByText(`12 drops at 83% average — your closest month of ${year}.`)).toBeTruthy();

    // Archetype derived from the real rows: 12 twins over 12 drops.
    await next();
    expect(getByText('the mind readers')).toBeTruthy();
    expect(
      getByText('12 twin answers across 12 drops — you two keep landing on the same thought.')
    ).toBeTruthy();

    // Share slide carries the real year average.
    await next();
    expect(getByText(/world your year/)).toBeTruthy();
    expect(getByText('ALEX & JORDAN · 83% IN SYNC')).toBeTruthy();
  });

  it('shows the month-by-month hit-rate curve when the year spans multiple months', async () => {
    // A second month of the same year (June, or January when now is January).
    const otherMonth = now.getMonth() === 0 ? 5 : 0;
    const otherRows = Array.from({ length: 4 }, (_, i) => ({
      date: iso(new Date(year, otherMonth, 1), i + 1),
      code: `Y${i + 1}`,
      title: `year drop ${i + 1}`,
      wavelength: 90,
      twins_count: 0,
    }));
    mockData({ history: [...TWELVE_THIS_MONTH, ...otherRows] });

    const user = userEvent.setup();
    const { getByText, getByLabelText } = await render(<WrappedScreen />);
    const next = () => user.press(getByLabelText('Next slide'));

    await user.press(getByText('rewind the whole year →'));

    // 16 drops, (996 + 360) / 16 = 84.75 -> 85.
    await next();
    expect(getByText('16')).toBeTruthy();
    await next();
    expect(getByText('85%')).toBeTruthy();

    // The curve slide: exact per-month averages with their month labels.
    await next();
    expect(getByText('your average wavelength, every month you played.')).toBeTruthy();
    expect(getByText('90')).toBeTruthy();
    expect(getByText('83')).toBeTruthy();
    expect(getByText(monthShort(otherMonth + 1))).toBeTruthy();
    expect(getByText(monthShort(now.getMonth() + 1))).toBeTruthy();

    // Most telepathic month: the 90% month beats this month's 83%.
    await next();
    expect(getByText('90%')).toBeTruthy();
    expect(getByText(monthName(otherMonth + 1))).toBeTruthy();
    expect(getByText(`4 drops at 90% average — your closest month of ${year}.`)).toBeTruthy();
  });

  it('gates the annual wrapped behind its own minimum and toggles back', async () => {
    // 6 drops: enough for the month (>= 5), not for the year (< 10).
    mockData({ history: TWELVE_THIS_MONTH.slice(0, 6) });
    const user = userEvent.setup();
    const { getByText, queryByText } = await render(<WrappedScreen />);

    expect(getByText(`parallax · ${month}`)).toBeTruthy();

    await user.press(getByText('rewind the whole year →'));
    expect(getByText('your year is still writing itself')).toBeTruthy();
    expect(queryByText(`parallax · ${year}`)).toBeNull();

    await user.press(getByText('back to this month →'));
    expect(getByText(`parallax · ${month}`)).toBeTruthy();
  });

  it('lets a sparse month rewind the year from the not-yet state', async () => {
    mockData({ history: TWELVE_THIS_MONTH.slice(0, 4) });
    const user = userEvent.setup();
    const { getByText } = await render(<WrappedScreen />);

    expect(getByText('your first month is still writing itself')).toBeTruthy();

    await user.press(getByText('rewind the whole year →'));
    expect(getByText('your year is still writing itself')).toBeTruthy();
  });

  it('does not count reveals from a previous month', async () => {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const lastMonth = WAVES.map((wavelength, i) => ({
      date: iso(prev, 12 - i),
      code: `W${12 - i}`,
      title: `drop ${12 - i}`,
      wavelength,
      twins_count: 1,
    }));
    mockData({ history: lastMonth });

    const { getByText } = await render(<WrappedScreen />);

    expect(getByText('your first month is still writing itself')).toBeTruthy();
  });
});

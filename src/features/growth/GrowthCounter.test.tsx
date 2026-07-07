/**
 * V2 F5 growth counter (V2_PLAN §10): one full-width hero stat behind
 * f5_growth_counter — exact count, private badge, warm empty state,
 * hidden with the flag off.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockFlagRows = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => mockFlagRows() }),
  },
}));

import { GrowthCounter } from './GrowthCounter';
import { __resetFlagsForTest } from '../../lib/flags';

beforeEach(() => {
  __resetFlagsForTest();
  mockFlagRows
    .mockReset()
    .mockResolvedValue({ data: [{ key: 'f5_growth_counter', enabled: true }], error: null });
});

describe('GrowthCounter', () => {
  it('renders the exact count with the hero unit line', async () => {
    const { getAllByText, getByText } = await render(
      <GrowthCounter count={23} privateCount={0} />
    );
    // GradientText renders its text twice (MaskedView mask + fill)
    await waitFor(() => expect(getAllByText('23')).toHaveLength(2));
    expect(getByText('things you now know about each other')).toBeTruthy();
  });

  it('is singular-safe at 1', async () => {
    const { getAllByText, getByText } = await render(
      <GrowthCounter count={1} privateCount={0} />
    );
    await waitFor(() => expect(getAllByText('1')).toHaveLength(2));
    expect(getByText('thing you now know about each other')).toBeTruthy();
  });

  it('badges private solo insights separately', async () => {
    const { getByText } = await render(<GrowthCounter count={5} privateCount={2} />);
    await waitFor(() => expect(getByText('2 of them just for you 🔒')).toBeTruthy());
  });

  it('renders the warm empty state at zero, never a blank', async () => {
    const { getByText } = await render(<GrowthCounter count={0} privateCount={0} />);
    await waitFor(() =>
      expect(getByText('your map starts with tonight’s drop 🗺️')).toBeTruthy()
    );
  });

  it('renders nothing when the flag is off', async () => {
    mockFlagRows.mockResolvedValue({ data: [], error: null });
    const { queryByTestId } = await render(<GrowthCounter count={23} privateCount={0} />);
    await waitFor(() => expect(queryByTestId('growth-counter')).toBeNull());
  });
});

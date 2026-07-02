import React from 'react';
import { render } from '@testing-library/react-native';

let mockParams: { code?: string } = {};

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

import DropDetailScreen from '../dropDetail';

describe('DropDetailScreen', () => {
  beforeEach(() => {
    mockParams = {};
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

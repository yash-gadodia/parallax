import React from 'react';
import { render } from '@testing-library/react-native';
import DropDetailScreen from '../dropDetail';

describe('DropDetailScreen', () => {
  it('renders the first drop from ARCHIVE with questions and labels', async () => {
    const { getByText, getAllByText } = await render(<DropDetailScreen />);

    // Should render the drop code in TopBar
    expect(getByText('DROP 26')).toBeTruthy();

    // Should render a question from the first drop
    expect(getByText('Biggest ick?')).toBeTruthy();

    // Should render column labels (multiple instances of "you" exist, so getAllByText)
    const youLabels = getAllByText('you');
    expect(youLabels.length).toBeGreaterThan(0);

    const daniLabels = getAllByText('Dani');
    expect(daniLabels.length).toBeGreaterThan(0);
  });
});

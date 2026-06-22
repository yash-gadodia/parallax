import React from 'react';
import { render } from '@testing-library/react-native';
import MilestoneScreen from './milestone';

describe('MilestoneScreen', () => {
  it('renders the milestone heading and cta buttons', async () => {
    const { getByText } = await render(<MilestoneScreen />);

    // Assert the days counter subheader is rendered
    expect(getByText('days in a row, together')).toBeTruthy();

    // Assert the Share button is rendered
    expect(getByText('Share our milestone')).toBeTruthy();

    // Assert the Keep going button is rendered
    expect(getByText('Keep it going')).toBeTruthy();
  });
});

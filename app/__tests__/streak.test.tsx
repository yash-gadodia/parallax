import React from 'react';
import { render } from '@testing-library/react-native';
import StreakScreen from '../streak';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(() => ({
    couple: { streak: 23 },
  })),
}));

describe('StreakScreen', () => {
  it('renders the streak screen with key sections', async () => {
    const { getByText } = await render(<StreakScreen />);

    // Check TopBar title
    expect(getByText('your streak')).toBeTruthy();

    // Check main streak label
    expect(getByText('day shared streak')).toBeTruthy();

    // Check week section
    expect(getByText('this week')).toBeTruthy();

    // Check milestones section heading (contains "milestones · next at")
    expect(getByText(/milestones · next at/)).toBeTruthy();

    // Check freeze section (text contains the freeze count which is dynamic)
    expect(getByText(/Streak freeze/)).toBeTruthy();

    // Check freeze button
    expect(getByText('Arm')).toBeTruthy();

    // Check longest streak stat
    expect(getByText('longest streak together · 41 days')).toBeTruthy();
  });
});

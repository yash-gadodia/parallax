import { render } from '@testing-library/react-native';
import React from 'react';
import ActivityScreen from '../activity';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

jest.mock('../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: null }),
}));

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({ couple: null }),
}));

jest.mock('../../src/features/engagement/useActivity', () => ({
  useActivity: () => ({
    items: [],
    markAllRead: jest.fn(),
    loading: false,
  }),
}));

describe('ActivityScreen', () => {
  it('renders the activity feed with sample data when not paired', async () => {
    const { getByText } = await render(<ActivityScreen />);

    // The screen shows the title "activity" via TopBar
    expect(getByText('activity')).toBeDefined();

    // When not paired (no session/couple), sample ACTIVITY renders
    // First sample item: "Dani played today's drop"
    expect(getByText("Dani played today's drop")).toBeDefined();

    // Footer text shown when displayItems.length > 0
    expect(getByText("that's everything · just you two")).toBeDefined();
  });
});

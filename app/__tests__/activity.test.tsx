import { render } from '@testing-library/react-native';
import React from 'react';
import ActivityScreen from '../activity';
import type { Activity } from '../../src/types/db';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockUseSession = jest.fn();
jest.mock('../../src/features/auth/useSession', () => ({
  useSession: () => mockUseSession(),
}));

const mockUseCouple = jest.fn();
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => mockUseCouple(),
}));

const mockUseActivity = jest.fn();
jest.mock('../../src/features/engagement/useActivity', () => ({
  useActivity: () => mockUseActivity(),
}));

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: null });
    mockUseCouple.mockReturnValue({ couple: null });
    mockUseActivity.mockReturnValue({
      items: [],
      markAllRead: jest.fn().mockResolvedValue(undefined),
      loading: false,
    });
  });

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

  it('demo samples only promise kinds with a real producer (no pack/refocus/reveal)', async () => {
    const { getByText, queryByText } = await render(<ActivityScreen />);

    // The three kept kinds' samples
    expect(getByText("Dani played today's drop")).toBeDefined();
    expect(getByText('Dani nudged you')).toBeDefined();
    expect(getByText('You hit a 23-day streak')).toBeDefined();

    // The producer-less kinds' copy is gone
    expect(queryByText('Dani sent you a pack')).toBeNull();
    expect(queryByText('You refocused "the Saturday silence"')).toBeNull();
    expect(queryByText('A twin moment on DROP 26')).toBeNull();
  });

  it('paired: renders a real milestone activity row with its kind copy', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'user-a' } } });
    mockUseCouple.mockReturnValue({ couple: { id: 'couple-1' } });
    const milestoneRow: Activity = {
      id: 'act-milestone-1',
      couple_id: 'couple-1',
      kind: 'milestone',
      actor: null,
      payload: { days: 3 },
      read_by: [],
      created_at: new Date(Date.now() - 30_000).toISOString(),
    };
    mockUseActivity.mockReturnValue({
      items: [milestoneRow],
      markAllRead: jest.fn().mockResolvedValue(undefined),
      loading: false,
    });

    const { getByText, queryByText } = await render(<ActivityScreen />);

    // The milestone kind renders with its copy map entry
    expect(getByText('You hit a milestone')).toBeDefined();
    expect(getByText('Keep the streak alive.')).toBeDefined();
    expect(getByText('just now')).toBeDefined();

    // Real feed, not the demo samples
    expect(queryByText("Dani played today's drop")).toBeNull();
    expect(getByText("that's everything · just you two")).toBeDefined();
  });
});

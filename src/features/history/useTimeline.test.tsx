import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useTimeline } from './useTimeline';
import { ARCHIVE } from '../../content/drop';
import type { TimelineEntry, DropEntry, PairupEntry } from './timeline';

// Regression for the isSample false positive: useCoupleHistory is REAL here —
// only auth/couple/data sources are mocked — so a signed-in couple with
// exactly ARCHIVE.length revealed drops must get their real timeline, never
// the demo one (no fabricated 2024-02-01 pair-up, rows keep couple_drop_id).

const mockUseSession = jest.fn();
const mockUseCouple = jest.fn();
const mockRpc = jest.fn();

jest.mock('../auth/useSession', () => ({
  useSession: () => mockUseSession(),
}));

jest.mock('../pairing/useCouple', () => ({
  useCouple: () => mockUseCouple(),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

jest.mock('../engagement/useActivity', () => ({
  useActivity: jest.fn(() => ({
    items: [],
    unreadCount: 0,
    loading: false,
    refetch: jest.fn(),
  })),
}));

jest.mock('../profile/useProfile', () => ({
  useProfile: jest.fn(() => ({
    name: 'Alex',
    partnerName: 'Jordan',
    streak: 7,
    togetherSince: 'March 2025',
    loading: false,
  })),
}));

// Exactly ARCHIVE.length (3) revealed drops — the shape that used to trip the
// demo heuristic.
const REAL_ROWS = [
  {
    couple_drop_id: 'cd-3',
    date: '2026-07-02',
    code: 'W12',
    title: 'the hot seat',
    wavelength: 82,
    twins_count: 2,
    caught_up: false,
  },
  {
    couple_drop_id: 'cd-2',
    date: '2026-07-01',
    code: 'W11',
    title: 'green flags',
    wavelength: 74,
    twins_count: 1,
    caught_up: false,
  },
  {
    couple_drop_id: 'cd-1',
    date: '2026-06-30',
    code: 'W10',
    title: 'first times',
    wavelength: 66,
    twins_count: 0,
    caught_up: true,
  },
];

async function renderTimeline() {
  let captured: ReturnType<typeof useTimeline> | null = null;

  function TestComponent() {
    captured = useTimeline();
    return null;
  }

  await act(async () => {
    render(<TestComponent />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  return () => captured as unknown as ReturnType<typeof useTimeline>;
}

describe('useTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it('a signed-in couple with exactly 3 revealed drops sees their REAL story (no fake pair-up, full routing)', async () => {
    expect(REAL_ROWS).toHaveLength(ARCHIVE.length);
    mockUseSession.mockReturnValue({
      session: { user: { id: 'user-a' } },
      loading: false,
    });
    mockUseCouple.mockReturnValue({
      couple: {
        id: 'couple-1',
        together_since: '2025-11-14',
        created_at: '2026-06-20T09:00:00Z',
      },
      loading: false,
      status: 'active',
    });
    mockRpc.mockResolvedValue({ data: REAL_ROWS, error: null });

    const state = (await renderTimeline())();

    expect(state.loading).toBe(false);
    expect(state.isSample).toBe(false);

    // The real pair-up (couple.together_since), never the demo's 2024-02-01.
    const pairups = state.entries.filter(
      (e: TimelineEntry): e is PairupEntry => e.kind === 'pairup'
    );
    expect(pairups).toHaveLength(1);
    expect(pairups[0].date).toBe('2025-11-14');
    expect(pairups[0].label).toBe('Alex & Jordan paired up');
    expect(
      state.entries.some((e: TimelineEntry) => e.kind !== 'month' && e.date === '2024-02-01')
    ).toBe(false);

    // The couple's actual drops, each carrying its couple_drop_id so detail
    // rows route to the REAL drop (cdid), not the code-only ARCHIVE fallback.
    const drops = state.entries.filter(
      (e: TimelineEntry): e is DropEntry => e.kind === 'drop'
    );
    expect(drops.map((d) => d.code)).toEqual(['W12', 'W11', 'W10']);
    expect(drops.map((d) => d.couple_drop_id)).toEqual(['cd-3', 'cd-2', 'cd-1']);

    // No demo milestone got injected (the activity feed is empty here).
    expect(state.entries.some((e: TimelineEntry) => e.kind === 'milestone')).toBe(false);
  });

  it('the signed-out demo still builds the sample story (pair-up + demo milestone)', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });

    const state = (await renderTimeline())();

    expect(state.isSample).toBe(true);
    const pairups = state.entries.filter(
      (e: TimelineEntry): e is PairupEntry => e.kind === 'pairup'
    );
    expect(pairups).toHaveLength(1);
    expect(pairups[0].date).toBe('2024-02-01');
    expect(state.entries.some((e: TimelineEntry) => e.kind === 'milestone')).toBe(true);
    // Sample drops come from ARCHIVE and carry no couple_drop_id.
    const drops = state.entries.filter(
      (e: TimelineEntry): e is DropEntry => e.kind === 'drop'
    );
    expect(drops).toHaveLength(ARCHIVE.length);
    expect(drops.every((d) => d.couple_drop_id === '')).toBe(true);
  });
});

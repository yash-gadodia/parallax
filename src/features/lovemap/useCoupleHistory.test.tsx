import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useCoupleHistory } from './useCoupleHistory';
import { ARCHIVE } from '../../content/drop';

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

// A real couple's history rows: couple_drop_id present, real dates.
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

async function renderHook() {
  let captured: ReturnType<typeof useCoupleHistory> | null = null;

  function TestComponent() {
    captured = useCoupleHistory();
    return null;
  }

  await act(async () => {
    render(<TestComponent />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  return () => captured as unknown as ReturnType<typeof useCoupleHistory>;
}

describe('useCoupleHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  describe('returns sample history when no session/couple', () => {
    it('returns ARCHIVE as sample history when session and couple are both null', async () => {
      const state = (await renderHook())();

      // State should be settled
      expect(state.loading).toBe(false);
      expect(state.isSample).toBe(true);
      expect(state.error).toBe(null);

      // Should have same count as ARCHIVE, and never hit the network
      expect(state.history).toHaveLength(ARCHIVE.length);
      expect(mockRpc).not.toHaveBeenCalled();

      // Verify the structure matches CoupleHistoryRow
      state.history.forEach((row, idx) => {
        const archiveItem = ARCHIVE[idx];
        expect(row.code).toBe(archiveItem.code);
        expect(row.title).toBe(archiveItem.title);
        expect(row.wavelength).toBe(archiveItem.wave);
        expect(row.twins_count).toBe(archiveItem.twins);
        // date is today's ISO string (date part)
        expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('maps ARCHIVE fields to CoupleHistoryRow shape correctly', async () => {
      const state = (await renderHook())();

      expect(state.history).toHaveLength(3);

      // Verify first item (DROP 26)
      const first = state.history[0];
      expect(first.code).toBe('DROP 26');
      expect(first.title).toBe('the ick list');
      expect(first.wavelength).toBe(88);
      expect(first.twins_count).toBe(2);

      // Verify second item (DROP 25)
      const second = state.history[1];
      expect(second.code).toBe('DROP 25');
      expect(second.title).toBe('future tense');
      expect(second.wavelength).toBe(74);
      expect(second.twins_count).toBe(1);

      // Verify third item (DROP 24)
      const third = state.history[2];
      expect(third.code).toBe('DROP 24');
      expect(third.title).toBe('red flags');
      expect(third.wavelength).toBe(80);
      expect(third.twins_count).toBe(2);
    });

    it('marks sample history with isSample=true', async () => {
      const state = (await renderHook())();
      expect(state.isSample).toBe(true);
    });
  });

  describe('a real signed-in couple is NEVER a sample (regression: data-shape guess)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'user-a' } },
        loading: false,
      });
      mockUseCouple.mockReturnValue({
        couple: { id: 'couple-1' },
        loading: false,
        status: 'active',
      });
    });

    it('a couple with exactly ARCHIVE.length (3) revealed drops gets their REAL history, isSample=false', async () => {
      // The old bug: history.length === ARCHIVE.length flagged a real couple
      // as demo, injecting a fake pair-up and demoting rows to code-only routing.
      expect(REAL_ROWS).toHaveLength(ARCHIVE.length);
      mockRpc.mockResolvedValue({ data: REAL_ROWS, error: null });

      const state = (await renderHook())();

      expect(mockRpc).toHaveBeenCalledWith('couple_history', { p_couple: 'couple-1' });
      expect(state.loading).toBe(false);
      expect(state.isSample).toBe(false);
      expect(state.error).toBe(null);
      expect(state.history).toEqual(REAL_ROWS);
      // Real rows keep their couple_drop_id so detail routing stays live.
      expect(state.history[0].couple_drop_id).toBe('cd-3');
    });

    it('a couple with no history yet gets the real empty state, not the sample', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const state = (await renderHook())();

      expect(state.isSample).toBe(false);
      expect(state.history).toEqual([]);
    });

    it('a failed fetch stays non-sample: empty history + an honest error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('network down') });

      const state = (await renderHook())();

      expect(state.isSample).toBe(false);
      expect(state.history).toEqual([]);
      expect(state.error).toBeInstanceOf(Error);
    });
  });
});

import { ensureTodayDrop, ensureYesterdayDrop, submitMyAnswers, fetchReveal, getTodayState } from './dropActions';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'me' } } })) },
  },
}));
jest.mock('../engagement/engagementActions', () => ({
  completeDrop: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../store/ui', () => ({
  useUiStore: { getState: () => ({ fireToast: jest.fn() }) },
}));
jest.mock('./dropLearning', () => ({
  persistDropLearning: jest.fn(() => Promise.resolve()),
}));
jest.mock('../notifications', () => ({
  notifyPartner: jest.fn(() => Promise.resolve()),
}));

import { supabase } from '../../lib/supabase';
import { completeDrop } from '../engagement/engagementActions';
import { notifyPartner } from '../notifications';

const mockSupabase = supabase as unknown as {
  rpc: jest.Mock;
  from: jest.Mock;
  auth: { getUser: jest.Mock };
};

// A thenable query builder: chainable methods return `self`, and `await`-ing it
// (or maybeSingle()) resolves to the supplied result - covers every chain shape used.
function builder(result: unknown) {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.eq = () => self;
  self.order = () => self;
  self.maybeSingle = () => Promise.resolve(result);
  self.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return self;
}

// Standard table routing for submitMyAnswers: couple_drops row + 3 prompts.
function mockSubmitTables(promptIds: string[] = ['p1', 'p2', 'p3']) {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'couple_drops') {
      return builder({ data: { drop_id: 'd-1' }, error: null });
    }
    if (table === 'drop_prompts') {
      return builder({ data: promptIds.map((id) => ({ id })), error: null });
    }
    return builder({ data: null, error: null });
  });
}

describe('dropActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
  });

  describe('ensureTodayDrop', () => {
    it('calls the ensure_today_drop RPC and returns the couple_drop id', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 'cd-1', error: null });
      const id = await ensureTodayDrop('couple-1');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('ensure_today_drop', { p_couple: 'couple-1' });
      expect(id).toBe('cd-1');
    });

    it('throws when the RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'nope' } });
      await expect(ensureTodayDrop('couple-1')).rejects.toBeDefined();
    });
  });

  describe('ensureYesterdayDrop', () => {
    it('calls the ensure_yesterday_drop RPC and returns the couple_drop id', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 'cd-y1', error: null });
      const id = await ensureYesterdayDrop('couple-1');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('ensure_yesterday_drop', { p_couple: 'couple-1' });
      expect(id).toBe('cd-y1');
    });

    it('throws when the window is closed (server error surfaces, no fake id)', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'yesterday is already revealed' } });
      await expect(ensureYesterdayDrop('couple-1')).rejects.toBeDefined();
    });
  });

  describe('submitMyAnswers (catch-up, 0021)', () => {
    it("targets YESTERDAY's drop when catchUp is set and reports the flag from the server", async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-y2', error: null }) // ensure_yesterday_drop
        .mockResolvedValueOnce({
          data: { success: true, couple_drop_id: 'cd-y2', new_state: 'revealed', wave_pct: 80, caught_up: true },
          error: null,
        });
      mockSubmitTables(['p1']);

      const result = await submitMyAnswers('couple-1', [0], [1], { catchUp: true });

      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'ensure_yesterday_drop', { p_couple: 'couple-1' });
      expect(result).toEqual({ coupleDropId: 'cd-y2', state: 'revealed', wavePct: 80, caughtUp: true });
    });

    it('never touches ensure_yesterday_drop on a normal submit', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-10', error: null })
        .mockResolvedValueOnce({
          data: { success: true, couple_drop_id: 'cd-10', new_state: 'one_done', wave_pct: null },
          error: null,
        });
      mockSubmitTables(['p1']);

      await submitMyAnswers('couple-1', [0], [1]);

      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'ensure_today_drop', { p_couple: 'couple-1' });
    });

    it('submits against the EXACT loaded drop id — no re-ensure at submit time (midnight-straddle guard)', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, couple_drop_id: 'cd-loaded', new_state: 'one_done', wave_pct: null },
        error: null,
      }); // submit_answers ONLY
      mockSubmitTables(['p1']);

      const result = await submitMyAnswers('couple-1', [0], [1], {
        catchUp: true,
        coupleDropId: 'cd-loaded',
      });

      // The FIRST rpc call is already submit_answers — ensure_* never ran.
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'submit_answers', {
        p_couple_drop: 'cd-loaded',
        p_answers: [{ prompt_id: 'p1', pick: 0, hunch: 1 }],
      });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(result.coupleDropId).toBe('cd-loaded');
    });
  });

  describe('submitMyAnswers', () => {
    it('submits one answer per prompt of THIS drop and returns the server state — no partner sim, no client streak', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-9', error: null }) // ensure_today_drop
        .mockResolvedValueOnce({
          data: { success: true, couple_drop_id: 'cd-9', new_state: 'one_done', wave_pct: null },
          error: null,
        }); // submit_answers
      mockSubmitTables();

      const result = await submitMyAnswers('couple-1', [0, 1, 2], [2, 1, 0]);

      expect(result).toEqual({ coupleDropId: 'cd-9', state: 'one_done', wavePct: null, caughtUp: false });

      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'submit_answers', {
        p_couple_drop: 'cd-9',
        p_answers: [
          { prompt_id: 'p1', pick: 0, hunch: 2 },
          { prompt_id: 'p2', pick: 1, hunch: 1 },
          { prompt_id: 'p3', pick: 2, hunch: 0 },
        ],
      });
      // The demo helper and the client-driven streak are gone from the real flow.
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
      expect(completeDrop).not.toHaveBeenCalled();
    });

    it('fires only notifyPartner(played) when the partner has not answered yet', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-7', error: null })
        .mockResolvedValueOnce({
          data: { success: true, couple_drop_id: 'cd-7', new_state: 'one_done', wave_pct: null },
          error: null,
        });
      mockSubmitTables(['p1']);

      await submitMyAnswers('couple-1', [0], [1]);

      expect(notifyPartner).toHaveBeenCalledWith('cd-7', 'played');
      expect(notifyPartner).toHaveBeenCalledTimes(1);
    });

    it('fires only notifyPartner(revealed) when this submit completes the reveal, and returns the server wave', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-7', error: null })
        .mockResolvedValueOnce({
          data: { success: true, couple_drop_id: 'cd-7', new_state: 'revealed', wave_pct: 67 },
          error: null,
        });
      mockSubmitTables(['p1']);

      const result = await submitMyAnswers('couple-1', [0], [1]);

      expect(result).toEqual({ coupleDropId: 'cd-7', state: 'revealed', wavePct: 67, caughtUp: false });
      expect(notifyPartner).toHaveBeenCalledWith('cd-7', 'revealed');
      expect(notifyPartner).toHaveBeenCalledTimes(1);
    });

    it('does not call notifyPartner when there is no session', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-8', error: null })
        .mockResolvedValueOnce({
          data: { success: true, couple_drop_id: 'cd-8', new_state: 'one_done', wave_pct: null },
          error: null,
        });
      mockSubmitTables(['p1']);
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await submitMyAnswers('couple-1', [0], [1]);

      expect(notifyPartner).not.toHaveBeenCalled();
    });

    it('throws if there are no prompts', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 'cd-9', error: null });
      mockSubmitTables([]);
      await expect(submitMyAnswers('couple-1', [0], [0])).rejects.toBeDefined();
      expect(completeDrop).not.toHaveBeenCalled();
    });

    it('throws (and does not fake success) when submit_answers errors', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-9', error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });
      mockSubmitTables(['p1']);

      await expect(submitMyAnswers('couple-1', [0], [1])).rejects.toBeDefined();
      expect(notifyPartner).not.toHaveBeenCalled();
    });
  });

  describe('getTodayState', () => {
    it('returns the server state verbatim', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          exists: true,
          date: '2026-07-02',
          couple_drop_id: 'cd-1',
          state: 'one_done',
          wave_pct: null,
          i_answered: true,
          partner_answered: false,
          held: false,
        },
        error: null,
      });

      const state = await getTodayState('couple-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_today_state', { p_couple: 'couple-1' });
      expect(state).toEqual({
        exists: true,
        date: '2026-07-02',
        couple_drop_id: 'cd-1',
        state: 'one_done',
        wave_pct: null,
        i_answered: true,
        partner_answered: false,
        held: false,
      });
    });

    it('returns null (never a fabricated state) on error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'nope' } });
      const state = await getTodayState('couple-1');
      expect(state).toBeNull();
    });
  });

  describe('fetchReveal', () => {
    it('maps each author to you/them and scores the reveal', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'couple_drops') {
          return builder({ data: { id: 'cd-1', couple_id: 'c-1', state: 'revealed', drop_id: 'd-1', wave_pct: null }, error: null });
        }
        if (table === 'drop_prompts') {
          return builder({ data: [{ id: 'p1', position: 0 }], error: null });
        }
        if (table === 'answers') {
          return builder({
            data: [
              { prompt_id: 'p1', author: 'me', pick: 1, hunch: 2 },
              { prompt_id: 'p1', author: 'them', pick: 1, hunch: 0 },
            ],
            error: null,
          });
        }
        if (table === 'couples') {
          return builder({ data: { member_a: 'me', member_b: 'them' }, error: null });
        }
        return builder({ data: null, error: null });
      });

      const result = await fetchReveal('cd-1');
      expect(result.state).toBe('revealed');
      // p1: both picked 1 -> a twin moment
      expect(result.promptAnswers).toEqual([{ youPick: 1, youHunch: 2, themPick: 1, themHunch: 0 }]);
      expect(result.reveal.twins).toBe(1);
    });

    it('headlines the server-stored wave_pct when present', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'couple_drops') {
          return builder({ data: { id: 'cd-1', couple_id: 'c-1', state: 'revealed', drop_id: 'd-1', wave_pct: 73 }, error: null });
        }
        if (table === 'drop_prompts') {
          return builder({ data: [{ id: 'p1', position: 0 }], error: null });
        }
        if (table === 'answers') {
          return builder({
            data: [
              { prompt_id: 'p1', author: 'me', pick: 1, hunch: 2 },
              { prompt_id: 'p1', author: 'them', pick: 1, hunch: 0 },
            ],
            error: null,
          });
        }
        return builder({ data: null, error: null });
      });

      const result = await fetchReveal('cd-1');
      expect(result.reveal.wave).toBe(73);
    });

    it('maps "you" to the CURRENT user even when they are member_b', async () => {
      // The caller is "them" here — youPick must come from the 'them'-authored row.
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'them' } } });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'couple_drops') {
          return builder({ data: { id: 'cd-1', couple_id: 'c-1', state: 'revealed', drop_id: 'd-1', wave_pct: null }, error: null });
        }
        if (table === 'drop_prompts') {
          return builder({ data: [{ id: 'p1', position: 0 }], error: null });
        }
        if (table === 'answers') {
          return builder({
            data: [
              { prompt_id: 'p1', author: 'me', pick: 3, hunch: 4 },
              { prompt_id: 'p1', author: 'them', pick: 1, hunch: 2 },
            ],
            error: null,
          });
        }
        return builder({ data: null, error: null });
      });

      const result = await fetchReveal('cd-1');
      expect(result.promptAnswers).toEqual([{ youPick: 1, youHunch: 2, themPick: 3, themHunch: 4 }]);
    });
  });
});

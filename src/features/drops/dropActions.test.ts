import { ensureTodayDrop, submitMyAnswers, fetchReveal } from './dropActions';

jest.mock('../../lib/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));
jest.mock('../engagement/engagementActions', () => ({
  completeDrop: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../store/ui', () => ({
  useUiStore: { getState: () => ({ fireToast: jest.fn() }) },
}));

import { supabase } from '../../lib/supabase';
import { completeDrop } from '../engagement/engagementActions';

const mockSupabase = supabase as unknown as { rpc: jest.Mock; from: jest.Mock };

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

describe('dropActions', () => {
  beforeEach(() => jest.clearAllMocks());

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

  describe('submitMyAnswers', () => {
    it('submits one answer per prompt, then sims the partner and completes the drop', async () => {
      // rpc call order: ensure_today_drop -> submit_answers -> sim_partner_submit
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 'cd-9', error: null }) // ensure_today_drop
        .mockResolvedValueOnce({ error: null }) // submit_answers
        .mockResolvedValueOnce({ error: null }); // sim_partner_submit
      mockSupabase.from.mockReturnValue(
        builder({ data: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }], error: null })
      );

      await submitMyAnswers('couple-1', [0, 1, 2], [2, 1, 0]);

      // submit_answers got the picks/hunches mapped onto the ordered prompt ids
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'submit_answers', {
        p_couple_drop: 'cd-9',
        p_answers: [
          { prompt_id: 'p1', pick: 0, hunch: 2 },
          { prompt_id: 'p2', pick: 1, hunch: 1 },
          { prompt_id: 'p3', pick: 2, hunch: 0 },
        ],
      });
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(3, 'sim_partner_submit', { p_couple_drop: 'cd-9' });
      expect(completeDrop).toHaveBeenCalledWith('cd-9');
    });

    it('throws if there are no prompts', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 'cd-9', error: null });
      mockSupabase.from.mockReturnValue(builder({ data: [], error: null }));
      await expect(submitMyAnswers('couple-1', [0], [0])).rejects.toBeDefined();
      expect(completeDrop).not.toHaveBeenCalled();
    });
  });

  describe('fetchReveal', () => {
    it('maps each author to you/them and scores the reveal', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'couple_drops') {
          return builder({ data: { id: 'cd-1', couple_id: 'c-1', state: 'revealed', drop_id: 'd-1' }, error: null });
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
  });
});

import {
  startMoneyDate,
  advanceMoneyDate,
  completeMoneyDate,
  fetchMoneyDateState,
  parseMoneyDateState,
} from './moneyDateActions';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

const mockRpc = supabase.rpc as unknown as jest.Mock;

describe('moneyDateActions', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('startMoneyDate calls the RPC with the couple and returns the session id', async () => {
    mockRpc.mockResolvedValue({ data: 'session-1', error: null });
    await expect(startMoneyDate('couple-1')).resolves.toBe('session-1');
    expect(mockRpc).toHaveBeenCalledWith('start_money_date', { p_couple: 'couple-1' });
  });

  it('startMoneyDate throws the RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('Unauthorized: not a member of this couple') });
    await expect(startMoneyDate('couple-1')).rejects.toThrow(
      'Unauthorized: not a member of this couple'
    );
  });

  it('advanceMoneyDate sends the note and returns the new step', async () => {
    mockRpc.mockResolvedValue({ data: 2, error: null });
    await expect(advanceMoneyDate('session-1', 'a note')).resolves.toBe(2);
    expect(mockRpc).toHaveBeenCalledWith('advance_money_date', {
      p_session: 'session-1',
      p_note: 'a note',
    });
  });

  it('advanceMoneyDate passes a null note for skipped cards', async () => {
    mockRpc.mockResolvedValue({ data: 1, error: null });
    await expect(advanceMoneyDate('session-1', null)).resolves.toBe(1);
    expect(mockRpc).toHaveBeenCalledWith('advance_money_date', {
      p_session: 'session-1',
      p_note: null,
    });
  });

  it('completeMoneyDate sends the agreed action and resolves', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(completeMoneyDate('session-1', 'cook in on fridays')).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith('complete_money_date', {
      p_session: 'session-1',
      p_action: 'cook in on fridays',
    });
  });

  it('completeMoneyDate throws the RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('money_date_action_required') });
    await expect(completeMoneyDate('session-1', '')).rejects.toThrow('money_date_action_required');
  });

  it('fetchMoneyDateState parses the server jsonb into a typed state', async () => {
    mockRpc.mockResolvedValue({
      data: {
        open: { id: 'session-9', step: 2, started_by: 'user-1' },
        last_completed_at: '2026-06-12T09:30:00+00:00',
        last_agreed_action: 'coffee from home',
        sessions_completed: 3,
      },
      error: null,
    });
    await expect(fetchMoneyDateState('couple-1')).resolves.toEqual({
      open: { id: 'session-9', step: 2, started_by: 'user-1' },
      last_completed_at: '2026-06-12T09:30:00+00:00',
      last_agreed_action: 'coffee from home',
      sessions_completed: 3,
    });
    expect(mockRpc).toHaveBeenCalledWith('get_money_date_state', { p_couple: 'couple-1' });
  });

  it('fetchMoneyDateState throws on an RPC error (no silent fallback)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('network down') });
    await expect(fetchMoneyDateState('couple-1')).rejects.toThrow('network down');
  });
});

describe('parseMoneyDateState', () => {
  it('normalizes a never-dated couple (jsonb nulls) to a clean empty state', () => {
    expect(
      parseMoneyDateState({
        open: null,
        last_completed_at: null,
        last_agreed_action: null,
        sessions_completed: 0,
      })
    ).toEqual({
      open: null,
      last_completed_at: null,
      last_agreed_action: null,
      sessions_completed: 0,
    });
  });

  it('drops a malformed open shape instead of resuming into garbage', () => {
    const parsed = parseMoneyDateState({
      open: { id: 42, step: 'two' },
      last_completed_at: null,
      last_agreed_action: null,
      sessions_completed: 1,
    });
    expect(parsed).toEqual({
      open: null,
      last_completed_at: null,
      last_agreed_action: null,
      sessions_completed: 1,
    });
  });

  it('returns null for a non-object payload', () => {
    expect(parseMoneyDateState('nope')).toBeNull();
    expect(parseMoneyDateState(null)).toBeNull();
  });
});

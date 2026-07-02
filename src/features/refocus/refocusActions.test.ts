import {
  startRefocus,
  addRefocusSide,
  mediateSession,
  parseAiResult,
} from './refocusActions';
import { notifyRefocus } from '../notifications';
import { supabase } from '../../lib/supabase';
import type { RefocusMediation, RefocusSafety } from '../../content/refocus';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    functions: { invoke: jest.fn() },
  },
}));
jest.mock('../notifications', () => ({
  notifyRefocus: jest.fn(() => Promise.resolve()),
}));

const mockRpc = supabase.rpc as unknown as jest.Mock;
const mockInvoke = supabase.functions.invoke as jest.Mock;
const mockNotify = notifyRefocus as jest.Mock;

const MEDIATION: RefocusMediation = {
  type: 'mediation',
  shared_ground: 'you both want the weekend to feel shared',
  initiator_underneath: 'wanting the load to be seen',
  partner_underneath: 'wanting quiet without it meaning distance',
  initiator_bridge: 'hey, i want us to plan one thing together 🤍',
  partner_bridge: 'hey, my quiet was tiredness, not distance 🤍',
};

const SAFETY: RefocusSafety = {
  type: 'crisis',
  title: 'Before anything else, you matter.',
  message: 'Please reach out now.',
  helplines: [{ name: 'SOS (Samaritans of Singapore), 24h', contact: '1767' }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('startRefocus', () => {
  it('calls the start_refocus RPC with the couple, topic and side, and returns the session id', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'session-1', error: null });

    const id = await startRefocus('couple-1', 'the dishes thing', 'my real side');

    expect(id).toBe('session-1');
    expect(mockRpc).toHaveBeenCalledWith('start_refocus', {
      p_couple: 'couple-1',
      p_topic: 'the dishes thing',
      p_side: 'my real side',
    });
  });

  it('fires the partner push (fire-and-forget) after the RPC succeeds', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'session-1', error: null });

    await startRefocus('couple-1', 'topic', 'side');

    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith('couple-1');
  });

  it('throws the RPC error and does NOT push when start_refocus fails', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error('refocus_session_already_open'),
    });

    await expect(startRefocus('couple-1', 't', 's')).rejects.toThrow(
      'refocus_session_already_open'
    );
    expect(mockNotify).not.toHaveBeenCalled();
  });
});

describe('addRefocusSide', () => {
  it('calls the add_refocus_side RPC with the session and side', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    await addRefocusSide('session-1', 'my honest side');

    expect(mockRpc).toHaveBeenCalledWith('add_refocus_side', {
      p_session: 'session-1',
      p_side: 'my honest side',
    });
  });

  it('throws when the RPC rejects (e.g. the initiator tried to add)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error('refocus_initiator_cannot_add_partner_side'),
    });

    await expect(addRefocusSide('session-1', 'side')).rejects.toThrow(
      'refocus_initiator_cannot_add_partner_side'
    );
  });
});

describe('mediateSession', () => {
  it('invokes the refocus edge function with the sessionId and returns a valid mediation', async () => {
    mockInvoke.mockResolvedValueOnce({ data: MEDIATION, error: null });

    const result = await mediateSession('session-1');

    expect(mockInvoke).toHaveBeenCalledWith('refocus', {
      body: { sessionId: 'session-1' },
    });
    expect(result).toEqual(MEDIATION);
  });

  it('returns a safety result untouched (crisis routing renders server copy)', async () => {
    mockInvoke.mockResolvedValueOnce({ data: SAFETY, error: null });

    const result = await mediateSession('session-1');

    expect(result).toEqual(SAFETY);
  });

  it('returns null on an error payload (honest error state, never canned)', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'session_not_ready' },
    });

    expect(await mediateSession('session-1')).toBeNull();
  });

  it('returns null on a malformed payload', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { type: 'mediation', shared_ground: 'only this field' },
      error: null,
    });

    expect(await mediateSession('session-1')).toBeNull();
  });

  it('returns null when the invoke throws', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('network down'));

    expect(await mediateSession('session-1')).toBeNull();
  });
});

describe('parseAiResult', () => {
  it('accepts a stored mediation ai_result', () => {
    expect(parseAiResult(MEDIATION)).toEqual(MEDIATION);
  });

  it('accepts a stored abuse safety ai_result', () => {
    const abuse: RefocusSafety = { ...SAFETY, type: 'abuse' };
    expect(parseAiResult(abuse)).toEqual(abuse);
  });

  it('rejects null, junk, and wrong-typed payloads', () => {
    expect(parseAiResult(null)).toBeNull();
    expect(parseAiResult('mediation')).toBeNull();
    expect(parseAiResult({ type: 'verdict', winner: 'me' })).toBeNull();
  });
});

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useReactions, REACTION_EMOJIS } from './useReactions';
import type { Reaction } from '../../types/db';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
  channel: jest.Mock;
  removeChannel: jest.Mock;
  auth: { getUser: jest.Mock };
};

// A thenable query builder (dropActions.test pattern): chainable methods return
// `self`, awaiting it resolves the select result, and upsert resolves separately.
function builder(selectResult: unknown, upsert?: jest.Mock) {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.eq = () => self;
  self.then = (resolve: (v: unknown) => unknown) => resolve(selectResult);
  if (upsert) self.upsert = upsert;
  return self;
}

interface MockChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
}

function makeChannel() {
  let payloadHandler: ((payload: { new: unknown }) => void) | null = null;
  const channel: MockChannel = {
    on: jest.fn((_event: string, _cfg: unknown, handler: (payload: { new: unknown }) => void) => {
      payloadHandler = handler;
      return channel;
    }),
    subscribe: jest.fn(),
  };
  return { channel, firePayload: (p: { new: unknown }) => payloadHandler?.(p) };
}

type HookResult = ReturnType<typeof useReactions>;

function renderHook(coupleDropId: string | null) {
  const captured: { current: HookResult | null } = { current: null };
  function TestComponent() {
    captured.current = useReactions(coupleDropId);
    return null;
  }
  return { captured, ui: <TestComponent /> };
}

const row = (over: Partial<Reaction>): Reaction => ({
  id: 'r-1',
  couple_drop_id: 'cd-1',
  prompt_id: 'p1',
  author: 'me',
  emoji: '🥹',
  created_at: '2026-07-02T00:00:00Z',
  ...over,
});

describe('useReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
  });

  it('exposes the 4-emoji reveal palette', () => {
    expect(REACTION_EMOJIS).toEqual(['🥹', '😂', '❤️', '👀']);
  });

  it('returns an empty, non-loading state when coupleDropId is null', async () => {
    const { captured, ui } = renderHook(null);
    await act(async () => {
      render(ui);
    });

    expect(captured.current!.reactions).toEqual([]);
    expect(captured.current!.loading).toBe(false);
    expect(captured.current!.error).toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('fetches reactions, resolves my id, and subscribes with a unique reactions topic', async () => {
    const rows = [row({ id: 'r-1', author: 'me', emoji: '😂' })];
    mockSupabase.from.mockReturnValue(builder({ data: rows, error: null }));
    const { channel } = makeChannel();
    mockSupabase.channel.mockReturnValue(channel);

    const { captured, ui } = renderHook('cd-1');
    await act(async () => {
      render(ui);
    });
    await act(async () => {});

    expect(mockSupabase.from).toHaveBeenCalledWith('reactions');
    expect(captured.current!.loading).toBe(false);
    expect(captured.current!.myId).toBe('me');
    expect(captured.current!.reactions).toEqual(rows);

    expect(mockSupabase.channel).toHaveBeenCalledWith(expect.stringContaining('reactions-cd-1-'));
    expect(channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: 'couple_drop_id=eq.cd-1',
      },
      expect.any(Function)
    );
    expect(channel.subscribe).toHaveBeenCalled();
  });

  it('merges a realtime payload, replacing the same author+prompt reaction', async () => {
    const rows = [row({ id: 'r-1', author: 'them', emoji: '🥹' })];
    mockSupabase.from.mockReturnValue(builder({ data: rows, error: null }));
    const { channel, firePayload } = makeChannel();
    mockSupabase.channel.mockReturnValue(channel);

    const { captured, ui } = renderHook('cd-1');
    await act(async () => {
      render(ui);
    });
    await act(async () => {});

    // The partner re-reacts on the same prompt: replaces, never duplicates.
    await act(async () => {
      firePayload({ new: row({ id: 'r-2', author: 'them', emoji: '👀' }) });
    });
    expect(captured.current!.reactions).toEqual([row({ id: 'r-2', author: 'them', emoji: '👀' })]);

    // A reaction on another prompt is appended.
    await act(async () => {
      firePayload({ new: row({ id: 'r-3', author: 'them', prompt_id: 'p2', emoji: '❤️' }) });
    });
    expect(captured.current!.reactions).toEqual([
      row({ id: 'r-2', author: 'them', emoji: '👀' }),
      row({ id: 'r-3', author: 'them', prompt_id: 'p2', emoji: '❤️' }),
    ]);
  });

  it('react() upserts on the composite key and shows my reaction optimistically', async () => {
    const upsert = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockImplementation(() => builder({ data: [], error: null }, upsert));
    const { channel } = makeChannel();
    mockSupabase.channel.mockReturnValue(channel);

    const { captured, ui } = renderHook('cd-1');
    await act(async () => {
      render(ui);
    });
    await act(async () => {});

    await act(async () => {
      await captured.current!.react('p1', '❤️');
    });

    expect(upsert).toHaveBeenCalledWith(
      { couple_drop_id: 'cd-1', prompt_id: 'p1', author: 'me', emoji: '❤️' },
      { onConflict: 'couple_drop_id,prompt_id,author' }
    );
    expect(captured.current!.reactions).toHaveLength(1);
    expect(captured.current!.reactions[0].emoji).toBe('❤️');
    expect(captured.current!.reactions[0].author).toBe('me');
    expect(captured.current!.error).toBeNull();
  });

  it('react() rolls back to server truth and surfaces the error when the upsert is rejected', async () => {
    const upsert = jest.fn(() => Promise.resolve({ error: { message: 'permission denied' } }));
    mockSupabase.from.mockImplementation(() => builder({ data: [], error: null }, upsert));
    const { channel } = makeChannel();
    mockSupabase.channel.mockReturnValue(channel);

    const { captured, ui } = renderHook('cd-1');
    await act(async () => {
      render(ui);
    });
    await act(async () => {});

    await act(async () => {
      await captured.current!.react('p1', '😂');
    });

    // The optimistic row is gone (server said no) and the error is exposed.
    expect(captured.current!.reactions).toEqual([]);
    expect(captured.current!.error?.message).toBe('permission denied');
  });

  it('removes the channel on unmount', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: [], error: null }));
    const { channel } = makeChannel();
    mockSupabase.channel.mockReturnValue(channel);

    const { ui } = renderHook('cd-1');
    let unmount: () => void = () => {};
    await act(async () => {
      const result = await render(ui);
      unmount = result.unmount;
    });
    await act(async () => {});

    expect(channel.subscribe).toHaveBeenCalled();
    await act(async () => {
      unmount();
    });
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});

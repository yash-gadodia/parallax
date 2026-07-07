import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useRefocusSession } from './useRefocusSession';
import type { RefocusSession } from '../../types/db';

// Capture the realtime callback so tests can push session changes through it.
// (`mock`-prefixed so the jest.mock factory below may reference them.)
let mockCapturedCallback: ((payload: { new: unknown }) => void) | null = null;
let mockChannelTopics: string[] = [];
const mockRemoved = { count: 0 };
let mockMaybeSingle: jest.Mock;

jest.mock('../../lib/supabase', () => {
  const makeQuery = () => {
    const q: Record<string, unknown> = {};
    ['select', 'eq', 'in', 'order', 'limit'].forEach((m) => {
      q[m] = () => q;
    });
    q.maybeSingle = (...args: unknown[]) => mockMaybeSingle(...args);
    return q;
  };
  return {
    supabase: {
      from: () => makeQuery(),
      channel: (topic: string) => {
        mockChannelTopics.push(topic);
        const c = {
          on: (
            _event: string,
            _filter: unknown,
            cb: (payload: { new: unknown }) => void
          ) => {
            mockCapturedCallback = cb;
            return c;
          },
          subscribe: () => c,
        };
        return c;
      },
      removeChannel: () => {
        mockRemoved.count += 1;
      },
    },
  };
});

const SESSION: RefocusSession = {
  id: 'session-1',
  couple_id: 'couple-1',
  initiator: 'user-a',
  topic: 'the dishes thing',
  initiator_side: 'i felt alone with the mess',
  partner_side: null,
  state: 'waiting_partner',
  ai_result: null,
  created_at: '2026-07-01T10:00:00Z',
  partner_joined_at: null,
  revealed_at: null,
  is_solo: false,
  solo_saved_at: null,
};

beforeEach(() => {
  mockCapturedCallback = null;
  mockChannelTopics = [];
  mockRemoved.count = 0;
  mockMaybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
});

describe('useRefocusSession', () => {
  it('returns no session and stops loading without a coupleId (demo mode)', async () => {
    const { result } = await renderHook(() => useRefocusSession(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(mockChannelTopics).toEqual([]);
  });

  it('fetches the open session and subscribes on a unique couple-scoped topic', async () => {
    mockMaybeSingle = jest.fn(() => Promise.resolve({ data: SESSION, error: null }));

    const { result } = await renderHook(() => useRefocusSession('couple-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(SESSION);
    expect(mockChannelTopics).toHaveLength(1);
    expect(mockChannelTopics[0]).toMatch(/^refocus-couple-1-\d+$/);
  });

  it('applies a realtime update to the held session (waiting_partner -> ready)', async () => {
    mockMaybeSingle = jest.fn(() => Promise.resolve({ data: SESSION, error: null }));

    const { result } = await renderHook(() => useRefocusSession('couple-1'));
    await waitFor(() => expect(result.current.session).not.toBeNull());

    const ready: RefocusSession = {
      ...SESSION,
      partner_side: 'i shut down when it piles up',
      partner_joined_at: '2026-07-01T11:00:00Z',
      state: 'ready',
    };
    await act(() => {
      mockCapturedCallback?.({ new: ready });
    });

    expect(result.current.session?.state).toBe('ready');
    expect(result.current.session?.partner_side).toBe(
      'i shut down when it piles up'
    );
  });

  it('adopts a brand-new session arriving over realtime when none is held', async () => {
    const { result } = await renderHook(() => useRefocusSession('couple-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();

    await act(() => {
      mockCapturedCallback?.({ new: SESSION });
    });

    expect(result.current.session?.id).toBe('session-1');
  });

  it('ignores realtime rows for a DIFFERENT session than the held one', async () => {
    mockMaybeSingle = jest.fn(() => Promise.resolve({ data: SESSION, error: null }));

    const { result } = await renderHook(() => useRefocusSession('couple-1'));
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(() => {
      mockCapturedCallback?.({ new: { ...SESSION, id: 'other-session', state: 'expired' } });
    });

    expect(result.current.session?.id).toBe('session-1');
    expect(result.current.session?.state).toBe('waiting_partner');
  });

  it('removes the channel on unmount', async () => {
    mockMaybeSingle = jest.fn(() => Promise.resolve({ data: SESSION, error: null }));

    const { result, unmount } = await renderHook(() => useRefocusSession('couple-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await unmount();

    expect(mockRemoved.count).toBe(1);
  });

  it('surfaces a fetch error and stops loading', async () => {
    mockMaybeSingle = jest.fn(() =>
      Promise.resolve({ data: null, error: new Error('permission denied') })
    );

    const { result } = await renderHook(() => useRefocusSession('couple-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('permission denied');
    expect(result.current.session).toBeNull();
  });

  it('refresh() re-fetches the open session', async () => {
    const { result } = await renderHook(() => useRefocusSession('couple-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();

    mockMaybeSingle = jest.fn(() => Promise.resolve({ data: SESSION, error: null }));
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.session?.id).toBe('session-1');
  });
});

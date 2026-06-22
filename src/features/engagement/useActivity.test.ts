import { renderHook } from '@testing-library/react-native';
import { useActivity } from './useActivity';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../../store/ui', () => ({
  useUiStore: jest.fn((selector: (state: { fireToast: () => void }) => unknown) =>
    selector({ fireToast: jest.fn() })
  ),
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as unknown as { from: jest.Mock; auth: { getUser: jest.Mock } };

describe('useActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
  });

  it('with a null coupleId returns an empty, loading feed and never queries', async () => {
    const { result } = await renderHook(() => useActivity(null));
    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(Array.isArray(result.current.items)).toBe(true);
    expect(result.current.items.length).toBe(0);
    expect(result.current.unreadCount).toBe(0);
    // No couple to load for, so it settles to not-loading.
    expect(result.current.loading).toBe(false);
  });

  it('exposes a markAllRead function that returns a promise', async () => {
    const { result } = await renderHook(() => useActivity(null));
    expect(typeof result.current.markAllRead).toBe('function');
    expect(result.current.markAllRead()).toBeInstanceOf(Promise);
  });
});

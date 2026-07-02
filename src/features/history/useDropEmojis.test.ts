import { renderHook, waitFor } from '@testing-library/react-native';
import { useDropEmojis } from './useDropEmojis';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));
jest.mock('../auth/useSession', () => ({
  useSession: jest.fn(() => ({ session: null, loading: false })),
}));

import { supabase } from '../../lib/supabase';

const { useSession } = require('../auth/useSession');
const mockFrom = (supabase as unknown as { from: jest.Mock }).from;

// Thenable query builder (the codebase pattern): chainable methods return
// `self`, awaiting it resolves to the supplied result.
function builder(result: unknown) {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.eq = () => self;
  self.in = () => self;
  self.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return self;
}

describe('useDropEmojis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({ session: null, loading: false });
  });

  it('maps each code to the emoji of its drop’s first prompt', async () => {
    useSession.mockReturnValue({ session: { user: { id: 'me' } }, loading: false });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drops') {
        return builder({
          data: [
            { id: 'd-1', code: 'W12' },
            { id: 'd-2', code: 'W13' },
          ],
          error: null,
        });
      }
      if (table === 'drop_prompts') {
        return builder({
          data: [
            { drop_id: 'd-1', emoji: '🧨' },
            { drop_id: 'd-2', emoji: '🌙' },
          ],
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });

    const { result } = await renderHook(() => useDropEmojis(['W12', 'W13']));

    await waitFor(() => {
      expect(result.current).toEqual({ W12: '🧨', W13: '🌙' });
    });
  });

  it('stays empty without a session (demo mode never hits the DB)', async () => {
    const { result } = await renderHook(() => useDropEmojis(['W12']));

    expect(result.current).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('stays empty for an empty code list', async () => {
    useSession.mockReturnValue({ session: { user: { id: 'me' } }, loading: false });

    const { result } = await renderHook(() => useDropEmojis([]));

    expect(result.current).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

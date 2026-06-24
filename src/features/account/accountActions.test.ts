import { Share } from 'react-native';
import { deleteMyAccount, exportMyData } from './accountActions';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as any;

const mockShare = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

describe('deleteMyAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls delete_my_account RPC', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: null });
    await deleteMyAccount();
    expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_my_account');
  });

  it('throws when RPC returns an error', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: new Error('rpc failed') });
    await expect(deleteMyAccount()).rejects.toThrow('rpc failed');
  });
});

describe('exportMyData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when not signed in', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(exportMyData()).rejects.toThrow('Not signed in');
  });

  it('gathers profile + answers + learnings then opens Share', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uid-1' } },
    });

    const makeQuery = (returnData: unknown) => {
      const q: any = {};
      ['select', 'eq', 'or', 'maybeSingle'].forEach((m) => {
        q[m] = () => q;
      });
      q.maybeSingle = () => Promise.resolve({ data: returnData, error: null });
      q.then = (resolve: (v: any) => unknown) =>
        resolve({ data: returnData, error: null });
      return q;
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return makeQuery({ id: 'uid-1', display_name: 'Yash' });
      if (table === 'answers') return makeQuery([{ id: 'ans-1' }]);
      if (table === 'couples') return makeQuery({ id: 'couple-1' });
      if (table === 'learnings') return makeQuery([{ id: 'learn-1' }]);
      return makeQuery(null);
    });

    await exportMyData();

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Parallax data' })
    );

    const shareArg = mockShare.mock.calls[0][0] as { message: string };
    const parsed = JSON.parse(shareArg.message);
    expect(parsed.profile).toMatchObject({ id: 'uid-1' });
    expect(parsed.answers).toHaveLength(1);
    expect(parsed.exported_at).toBeTruthy();
  });
});

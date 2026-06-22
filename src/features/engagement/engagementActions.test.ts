import { nudge, completeDrop } from './engagementActions';

const mockFireToast = jest.fn();
jest.mock('../../lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('../../store/ui', () => ({
  useUiStore: { getState: () => ({ fireToast: mockFireToast }) },
}));

import { supabase } from '../../lib/supabase';
const mockRpc = (supabase as unknown as { rpc: jest.Mock }).rpc;

describe('engagementActions', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('nudge', () => {
    it('calls nudge_partner and toasts success', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await nudge('couple-1');
      expect(mockRpc).toHaveBeenCalledWith('nudge_partner', { p_couple: 'couple-1' });
      expect(mockFireToast).toHaveBeenCalledWith('Nudge sent 👋');
    });

    it('throws and toasts an error when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'rate limited' } });
      await expect(nudge('couple-1')).rejects.toBeDefined();
      expect(mockFireToast).toHaveBeenCalledWith(expect.stringContaining('Error'));
    });
  });

  describe('completeDrop', () => {
    it('calls complete_streak with the couple_drop id', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await completeDrop('cd-1');
      expect(mockRpc).toHaveBeenCalledWith('complete_streak', { p_couple_drop: 'cd-1' });
    });

    it('throws when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'boom' } });
      await expect(completeDrop('cd-1')).rejects.toBeDefined();
    });
  });
});

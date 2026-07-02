import { nudge, completeDrop } from './engagementActions';

const mockFireToast = jest.fn();
jest.mock('../../lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('../../store/ui', () => ({
  useUiStore: { getState: () => ({ fireToast: mockFireToast }) },
}));
jest.mock('../notifications', () => ({ notifyNudge: jest.fn() }));

import { supabase } from '../../lib/supabase';
import { notifyNudge } from '../notifications';
const mockRpc = (supabase as unknown as { rpc: jest.Mock }).rpc;
const mockNotifyNudge = notifyNudge as jest.Mock;

describe('engagementActions', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('nudge', () => {
    it('calls nudge_partner and toasts success', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await nudge('couple-1');
      expect(mockRpc).toHaveBeenCalledWith('nudge_partner', { p_couple: 'couple-1' });
      expect(mockFireToast).toHaveBeenCalledWith('Nudge sent 👋');
    });

    it('fires the partner push (notifyNudge) after the RPC succeeds', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await nudge('couple-1');
      expect(mockNotifyNudge).toHaveBeenCalledWith('couple-1');
    });

    it('does NOT fire the push when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'boom' } });
      await expect(nudge('couple-1')).rejects.toBeDefined();
      expect(mockNotifyNudge).not.toHaveBeenCalled();
    });

    it('throws and toasts an error when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'rate limited' } });
      await expect(nudge('couple-1')).rejects.toBeDefined();
      expect(mockFireToast).toHaveBeenCalledWith(expect.stringContaining('Error'));
    });

    it('toasts the friendly copy when the nudge is rate-limited (1/day)', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'nudge_rate_limited' } });
      await expect(nudge('couple-1')).rejects.toBeDefined();
      expect(mockFireToast).toHaveBeenCalledWith(
        'already nudged today — give them a beat'
      );
      expect(mockNotifyNudge).not.toHaveBeenCalled();
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

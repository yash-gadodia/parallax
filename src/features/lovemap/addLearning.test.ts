import { addLearning } from './addLearning';

jest.mock('../../lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

import { supabase } from '../../lib/supabase';
const mockRpc = (supabase as unknown as { rpc: jest.Mock }).rpc;

describe('addLearning', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls add_learning RPC with mapped params and returns the id', async () => {
    mockRpc.mockResolvedValue({ data: 'learning-123', error: null });

    const result = await addLearning({
      coupleId: 'couple-1',
      aboutId: 'user-2',
      emoji: '💕',
      need: 'quality time',
      detail: 'prefers evenings',
      source: 'drop',
      origin: 'drop-456',
    });

    expect(mockRpc).toHaveBeenCalledWith('add_learning', {
      p_couple: 'couple-1',
      p_about: 'user-2',
      p_emoji: '💕',
      p_need: 'quality time',
      p_detail: 'prefers evenings',
      p_source: 'drop',
      p_origin: 'drop-456',
    });
    expect(result).toBe('learning-123');
  });

  it('handles refocus source', async () => {
    mockRpc.mockResolvedValue({ data: 'learning-789', error: null });

    const result = await addLearning({
      coupleId: 'couple-2',
      aboutId: 'user-1',
      emoji: '🎯',
      need: 'communication',
      detail: 'needs advance notice',
      source: 'refocus',
      origin: 'session-999',
    });

    expect(mockRpc).toHaveBeenCalledWith('add_learning', {
      p_couple: 'couple-2',
      p_about: 'user-1',
      p_emoji: '🎯',
      p_need: 'communication',
      p_detail: 'needs advance notice',
      p_source: 'refocus',
      p_origin: 'session-999',
    });
    expect(result).toBe('learning-789');
  });

  it('throws when the RPC errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'db error' } });

    await expect(
      addLearning({
        coupleId: 'couple-1',
        aboutId: 'user-2',
        emoji: '💕',
        need: 'time',
        detail: 'info',
        source: 'drop',
        origin: 'drop-1',
      })
    ).rejects.toBeDefined();
  });

  it('throws a generic error when rpc throws a non-Error', async () => {
    mockRpc.mockRejectedValue('unexpected string throw');

    await expect(
      addLearning({
        coupleId: 'couple-1',
        aboutId: 'user-2',
        emoji: '💕',
        need: 'time',
        detail: 'info',
        source: 'drop',
        origin: 'drop-1',
      })
    ).rejects.toThrow('Failed to add learning');
  });
});

import { render, act } from '@testing-library/react-native';
import React from 'react';
import { createCouple, joinCouple } from './pairingActions';
import { useCouple } from './useCouple';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as any;

const mockCoupleData = {
  id: 'couple-1',
  member_a: 'user-1',
  member_b: null,
  invite_code: 'YASH-4827',
  status: 'pending' as const,
  together_since: null,
  streak: 0,
  longest_streak: 0,
  freezes_remaining: 0,
  last_played_on: null,
  wavelength_avg: null,
  plus: false,
  created_at: '2026-06-21T00:00:00Z',
};

describe('Pairing Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCouple', () => {
    it('calls supabase.rpc with create_couple', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockCoupleData,
        error: null,
      } as any);

      const result = await createCouple();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_couple');
      expect(result).toEqual(mockCoupleData);
    });

    it('throws error when rpc fails', async () => {
      const mockError = new Error('RPC failed');
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(createCouple()).rejects.toThrow('RPC failed');
    });
  });

  describe('joinCouple', () => {
    it('normalizes invite code and calls rpc with join_couple', async () => {
      const activeCouple = { ...mockCoupleData, status: 'active' as const };
      mockSupabase.rpc.mockResolvedValue({
        data: activeCouple,
        error: null,
      } as any);

      const result = await joinCouple('yash 4827');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('join_couple', {
        p_code: 'YASH-4827',
      });
      expect(result).toEqual(activeCouple);
    });

    it('throws validation error for invalid invite code WITHOUT calling rpc', async () => {
      await expect(joinCouple('bad')).rejects.toThrow(
        'Invalid invite code format'
      );
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('throws error when rpc fails', async () => {
      const mockError = new Error('Code not found');
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(joinCouple('YASH-4827')).rejects.toThrow('Code not found');
    });
  });
});

describe('useCouple Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads initially, fetches couple and derives status', async () => {
    mockSupabase.auth.getUser.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                data: { user: { id: 'user-1' } },
                error: null,
              }),
            10
          )
        )
    );

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  data: mockCoupleData,
                  error: null,
                }),
              10
            )
          )
      ),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({}),
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useCouple();
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    expect(capturedState.loading).toBe(true);
    expect(capturedState.couple).toBe(null);
    expect(capturedState.status).toBe('none');

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(capturedState.loading).toBe(false);
    expect(capturedState.couple).toEqual(mockCoupleData);
    expect(capturedState.status).toBe('pending');
  });

  it('derives status "active" when couple.status is active', async () => {
    const activeCoupleData = { ...mockCoupleData, status: 'active' as const };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: activeCoupleData,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({}),
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useCouple();
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.status).toBe('active');
  });

  it('updates couple when realtime callback fires', async () => {
    let realtimeCallback: ((payload: any) => void) | null = null;

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: mockCoupleData,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockImplementation((_event, _filter, callback) => {
        realtimeCallback = callback;
        return {
          subscribe: jest.fn().mockReturnValue({}),
        };
      }),
      subscribe: jest.fn().mockReturnValue({}),
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useCouple();
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.status).toBe('pending');
    expect(capturedState.couple?.member_b).toBe(null);

    const updatedCoupleData = {
      ...mockCoupleData,
      member_b: 'user-2',
      status: 'active' as const,
    };

    await act(async () => {
      realtimeCallback?.({ new: updatedCoupleData });
    });

    expect(capturedState.couple).toEqual(updatedCoupleData);
    expect(capturedState.status).toBe('active');
  });

  it('returns status "none" when no couple exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    let capturedState: any = null;

    function TestComponent() {
      const state = useCouple();
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.loading).toBe(false);
    expect(capturedState.couple).toBe(null);
    expect(capturedState.status).toBe('none');
  });

  it('unsubscribes from realtime channel on unmount', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: mockCoupleData,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    // Realistic: .on() and .subscribe() both return the same channel object.
    const mockChannel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);

    mockSupabase.channel.mockReturnValue(mockChannel);

    function TestComponent() {
      useCouple();
      return null;
    }

    const result = await act(async () => {
      return render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(mockSupabase.removeChannel).not.toHaveBeenCalled();

    await act(async () => {
      (result as any).unmount?.();
    });

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});

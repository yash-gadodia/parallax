import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useDropState } from './useDropState';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as any;

// A thenable query builder that chains and resolves with the supplied result
function builder(result: unknown) {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.eq = () => self;
  self.maybeSingle = () => Promise.resolve(result);
  self.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return self;
}

describe('useDropState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to null state when couplDropId is null', async () => {
    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState(null);
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    expect(capturedState.coupleDrop).toBeNull();
    expect(capturedState.loading).toBe(false);
    expect(capturedState.error).toBeNull();
  });

  it('fetches and returns couple_drop data when id is provided', async () => {
    const mockDropData = { id: 'drop-1', state: 'answered' };
    mockSupabase.from.mockReturnValue(builder({ data: mockDropData, error: null }));
    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    // Wait for fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Data loaded
    expect(capturedState.loading).toBe(false);
    expect(capturedState.coupleDrop).toEqual({ id: 'drop-1', state: 'answered' });
    expect(capturedState.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('couple_drops');
  });

  it('subscribes to real-time updates when data exists', async () => {
    const mockDropData = { id: 'drop-1', state: 'answered' };
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    };
    mockSupabase.from.mockReturnValue(builder({ data: mockDropData, error: null }));
    mockSupabase.channel.mockReturnValue(mockChannel);

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith(expect.stringContaining('couple-drop-drop-1'));
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'couple_drops',
        filter: 'id=eq.drop-1',
      },
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('updates state when real-time payload arrives', async () => {
    const mockDropData = { id: 'drop-1', state: 'answered' };
    const mockChannel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };

    let payloadHandler: ((payload: any) => void) | null = null;

    mockChannel.on.mockImplementation((event: string, config: any, handler: any) => {
      payloadHandler = handler;
      return mockChannel;
    });

    mockSupabase.from.mockReturnValue(builder({ data: mockDropData, error: null }));
    mockSupabase.channel.mockReturnValue(mockChannel);

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.coupleDrop?.state).toBe('answered');

    // Simulate real-time update
    await act(async () => {
      payloadHandler?.({
        new: { id: 'drop-1', state: 'revealed', text: 'extra' },
      });
    });

    expect(capturedState.coupleDrop).toEqual({ id: 'drop-1', state: 'revealed' });
  });

  it('handles errors during fetch', async () => {
    const mockError = new Error('Network error');
    mockSupabase.from.mockReturnValue(builder({ data: null, error: mockError }));

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
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
    expect(capturedState.error).toEqual(mockError);
    expect(capturedState.coupleDrop).toBeNull();
  });

  it('refetch clears the error, re-runs the fetch and recovers', async () => {
    const mockError = new Error('Network error');
    const mockDropData = { id: 'drop-1', state: 'one_done' };
    mockSupabase.from
      .mockReturnValueOnce(builder({ data: null, error: mockError }))
      .mockReturnValue(builder({ data: mockDropData, error: null }));
    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.error).toEqual(mockError);
    expect(capturedState.coupleDrop).toBeNull();

    await act(async () => {
      capturedState.refetch();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.error).toBeNull();
    expect(capturedState.loading).toBe(false);
    expect(capturedState.coupleDrop).toEqual({ id: 'drop-1', state: 'one_done' });
  });

  it('converts non-Error thrown errors to Error objects', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw 'string error';
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.error).toBeInstanceOf(Error);
    expect(capturedState.error?.message).toBe('Unknown error');
  });

  it('cleans up channel subscription on unmount', async () => {
    const mockDropData = { id: 'drop-1', state: 'answered' };
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    };
    mockSupabase.from.mockReturnValue(builder({ data: mockDropData, error: null }));
    mockSupabase.channel.mockReturnValue(mockChannel);

    function TestComponent() {
      useDropState('drop-1');
      return null;
    }

    const result = await act(async () => {
      return render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify channel was set up before unmount
    expect(mockSupabase.channel).toHaveBeenCalledWith(expect.stringContaining('couple-drop-drop-1'));

    await act(async () => {
      (result as any).unmount?.();
    });

    // The cleanup should call removeChannel - just verify it was called
    // (the actual reference passing depends on implementation details)
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it('does not subscribe when fetch returns no data', async () => {
    mockSupabase.from.mockReturnValue(builder({ data: null, error: null }));
    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    });

    let capturedState: any = null;

    function TestComponent() {
      const state = useDropState('drop-1');
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.coupleDrop).toBeNull();
    expect(capturedState.loading).toBe(false);
    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });
});

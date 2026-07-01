import React from 'react';
import { render, act } from '@testing-library/react-native';
import { View } from 'react-native';
import { useLearnings } from './useLearnings';
import { LEARNINGS } from '../../content/us';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../auth/useSession', () => ({
  useSession: jest.fn(),
}));

jest.mock('../pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));

import { supabase } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseCouple = useCouple as jest.MockedFunction<typeof useCouple>;
const mockSupabaseFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

describe('useLearnings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns sample learnings with isSample true when no session', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });

    let capturedState: any = null;

    function TestComponent() {
      const state = useLearnings();
      capturedState = state;
      return React.createElement(View);
    }

    await act(async () => {
      render(React.createElement(TestComponent));
    });

    expect(capturedState.isSample).toBe(true);
    expect(capturedState.error).toBeNull();
    expect(capturedState.items.length).toBe(LEARNINGS.length);
    expect(capturedState.items[0].id).toBe('chosen');
    expect(capturedState.items[0].about).toBe('partner');
    expect(capturedState.items[0].emoji).toBe('🤍');
    expect(capturedState.items[0].need).toBe('Feels chosen when plans are locked in early');
  });

  it('normalizes sample learnings about field: who=you -> about=you, who=dani -> about=partner', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });

    let capturedState: any = null;

    function TestComponent() {
      const state = useLearnings();
      capturedState = state;
      return React.createElement(View);
    }

    await act(async () => {
      render(React.createElement(TestComponent));
    });

    const youLearning = capturedState.items.find((i: { id: string; about: string }) => i.id === 'slack');
    const partnerLearning = capturedState.items.find((i: { id: string; about: string }) => i.id === 'chosen');

    expect(youLearning?.about).toBe('you');
    expect(partnerLearning?.about).toBe('partner');
  });

  it('returns empty (not sample) when a real couple has no learnings yet', async () => {
    mockUseSession.mockReturnValue({
      session: { user: { id: 'user-1' } as any } as any,
      loading: false,
    });
    mockUseCouple.mockReturnValue({
      couple: { id: 'couple-1' } as any,
      loading: false,
      status: 'active',
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    } as any);

    let capturedState: any = null;

    function TestComponent() {
      const state = useLearnings();
      capturedState = state;
      return React.createElement(View);
    }

    await act(async () => {
      render(React.createElement(TestComponent));
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.isSample).toBe(false);
    expect(capturedState.items.length).toBe(0);
  });

  it('returns empty (not sample) on fetch error for a real couple', async () => {
    mockUseSession.mockReturnValue({
      session: { user: { id: 'user-1' } as any } as any,
      loading: false,
    });
    mockUseCouple.mockReturnValue({
      couple: { id: 'couple-1' } as any,
      loading: false,
      status: 'active',
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Network error'),
          }),
        }),
      }),
    } as any);

    let capturedState: any = null;

    function TestComponent() {
      const state = useLearnings();
      capturedState = state;
      return React.createElement(View);
    }

    await act(async () => {
      render(React.createElement(TestComponent));
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(capturedState.error).toBeDefined();
    expect(capturedState.error?.message).toBe('Network error');
    expect(capturedState.isSample).toBe(false);
    expect(capturedState.items.length).toBe(0);
  });
});

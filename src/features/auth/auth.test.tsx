import { Session } from '@supabase/supabase-js';
import { render, act } from '@testing-library/react-native';
import React from 'react';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInWithApple,
  signInWithGoogle,
} from './authActions';
import { useSession } from './useSession';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithIdToken: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as any;

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('calls signInWithPassword with correct arguments', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      await signInWithEmail('test@example.com', 'password123');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws error when signInWithPassword fails', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(signInWithEmail('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('signUpWithEmail', () => {
    it('calls signUp with email, password, and display_name in options.data', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      await signUpWithEmail('new@example.com', 'password123', 'John Doe');

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'John Doe',
          },
        },
      });
    });

    it('throws error when signUp fails', async () => {
      const mockError = new Error('Email already exists');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        signUpWithEmail('existing@example.com', 'password123', 'Jane Doe')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);

      await signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('throws error when signOut fails', async () => {
      const mockError = new Error('Sign out failed');
      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockError,
      } as any);

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('signInWithApple', () => {
    it('throws clear error when expo-apple-authentication is not available', async () => {
      await expect(signInWithApple()).rejects.toThrow(
        'Apple sign-in requires a dev build with expo-apple-authentication (service gate not yet configured)'
      );
    });
  });

  describe('signInWithGoogle', () => {
    it('throws clear error when Google sign-in is not configured', async () => {
      await expect(signInWithGoogle()).rejects.toThrow(
        'Google sign-in not configured (service gate not yet set up)'
      );
    });
  });
});

describe('useSession Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads initially as true, resolves to false after getSession', async () => {
    const mockSession: Session = {
      user: { id: 'user-1', email: 'test@example.com' } as any,
      access_token: 'token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      refresh_token: 'refresh',
    };

    mockSupabase.auth.getSession.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: { session: mockSession }, error: null }), 50)
        )
    );

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any);

    let capturedState: any = null;

    function TestComponent() {
      const state = useSession();
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    expect(capturedState.loading).toBe(true);
    expect(capturedState.session).toBe(null);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(capturedState.loading).toBe(false);
    expect(capturedState.session).toEqual(mockSession);
  });

  it('updates session when onAuthStateChange fires', async () => {
    const initialSession: Session = {
      user: { id: 'user-1', email: 'test@example.com' } as any,
      access_token: 'token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      refresh_token: 'refresh',
    };

    const newSession: Session = {
      user: { id: 'user-2', email: 'new@example.com' } as any,
      access_token: 'new-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      refresh_token: 'new-refresh',
    };

    let authCallback: ((event: string, session: Session | null) => void) | null = null;

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: initialSession },
      error: null,
    } as any);

    mockSupabase.auth.onAuthStateChange.mockImplementation(
      (callback: (event: string, session: Session | null) => void) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      }
    );

    let capturedState: any = null;

    function TestComponent() {
      const state = useSession();
      capturedState = state;
      return null;
    }

    await act(async () => {
      render(<TestComponent />);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(capturedState.session).toEqual(initialSession);

    await act(async () => {
      authCallback?.('SIGNED_IN', newSession);
    });

    expect(capturedState.session).toEqual(newSession);
  });

  it('unsubscribes from auth state changes on unmount', async () => {
    const mockUnsubscribe = jest.fn();

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    } as any);

    function TestComponent() {
      useSession();
      return null;
    }

    const result = await act(async () => {
      return render(<TestComponent />);
    });

    await act(async () => {
      (result as any).unmount?.();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
